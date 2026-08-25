import { expect, test } from '@playwright/test';
import { execute, query, querySingleValue } from './support/database';

/**
 * The schema behind invitations and lifecycle emails. These are rules the API cannot enforce on its
 * own: that a token is stored in a column the size of a digest, that one address is suppressed once
 * per charity, and above all that one lifecycle email cannot be claimed twice for the same fundraiser.
 *
 * Everything this suite writes is removed afterwards.
 */

const PROBE_ADDRESS = 'schema-probe@e2e-invite.test';
const PROBE_SUBJECT = 'E2E Schema Template';

const columnOf = (table: string, column: string): string =>
  querySingleValue(`
    SELECT ISNULL((
      SELECT TOP 1 DATA_TYPE + '|' + CAST(ISNULL(CHARACTER_MAXIMUM_LENGTH, 0) AS VARCHAR(10)) + '|' +
             IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'
    ), 'missing');
  `);

const indexNames = (table: string): string[] =>
  query(`
    SELECT idx.name FROM sys.indexes idx
    INNER JOIN sys.tables tbl ON tbl.object_id = idx.object_id
    WHERE tbl.name = '${table}' AND idx.name IS NOT NULL
    ORDER BY idx.name;
  `);

const uniqueIndexNames = (table: string): string[] =>
  query(`
    SELECT idx.name FROM sys.indexes idx
    INNER JOIN sys.tables tbl ON tbl.object_id = idx.object_id
    WHERE tbl.name = '${table}' AND idx.name IS NOT NULL AND idx.is_unique = 1
    ORDER BY idx.name;
  `);

const removeProbeRows = (): void =>
  execute(`
    DELETE FROM FundraiserInvitation WHERE EmailAddress = '${PROBE_ADDRESS}';
    DELETE FROM EmailSuppression WHERE EmailAddress = '${PROBE_ADDRESS}';
    DELETE FROM PeerToPeerEmailTemplate WHERE Subject = '${PROBE_SUBJECT}';
    DELETE FROM PeerToPeerEmailDispatch WHERE DispatchKey LIKE 'e2e-%';
  `);

const insertSuppression = (): void =>
  execute(`
    DECLARE @organizerId INT = (SELECT MIN(OrganizerId) FROM DonationCampaign WHERE IsDeleted = 0);

    INSERT INTO EmailSuppression
      (UniqueId, OrganizerId, EmailAddress, Reason, Detail, SuppressedOnUtc)
    VALUES
      (NEWID(), @organizerId, '${PROBE_ADDRESS}', 'HardBounce', 'Probe', SYSUTCDATETIME());
  `);

const insertDispatch = (key: string): void =>
  execute(`
    DECLARE @fundraiserId INT = (SELECT MIN(Id) FROM CampaignFundraiser WHERE IsDeleted = 0);
    DECLARE @campaignId INT = (
      SELECT DonationCampaignId FROM CampaignFundraiser WHERE Id = @fundraiserId
    );

    INSERT INTO PeerToPeerEmailDispatch
      (DonationCampaignId, CampaignFundraiserId, TemplateType, DispatchKey, SentOnUtc)
    VALUES
      (@campaignId, @fundraiserId, 'MilestoneReached', '${key}', SYSUTCDATETIME());
  `);

test.beforeEach(() => removeProbeRows());
test.afterAll(() => removeProbeRows());

test.describe('The invitation table', () => {
  test('Table_Exists_WithTheColumnsAnInvitationNeeds', () => {
    expect(columnOf('FundraiserInvitation', 'EmailAddress')).not.toBe('missing');
    expect(columnOf('FundraiserInvitation', 'TokenHash')).not.toBe('missing');
    expect(columnOf('FundraiserInvitation', 'ExpiresOnUtc')).not.toBe('missing');
    expect(columnOf('FundraiserInvitation', 'CurrentStatus')).not.toBe('missing');
    expect(columnOf('FundraiserInvitation', 'AcceptedOnUtc')).not.toBe('missing');
  });

  test('TokenHash_IsTheSizeOfADigest_SoAReadableCodeCouldNotFitInIt', () => {
    expect(columnOf('FundraiserInvitation', 'TokenHash')).toBe('nvarchar|64|NO');
  });

  test('TokenHash_IsUnique_SoOneCodeCanOnlyEverIdentifyOneInvitation', () => {
    expect(uniqueIndexNames('FundraiserInvitation')).toContain(
      'IX_FundraiserInvitation_TokenHash',
    );
  });

  test('Indexes_CoverBothWaysTheListIsRead_ByAddressAndByWhenItWasSent', () => {
    const names = indexNames('FundraiserInvitation');

    expect(names).toContain('IX_FundraiserInvitation_Campaign_Email');
    expect(names).toContain('IX_FundraiserInvitation_Campaign_CreatedOn');
  });

  test('PersonalMessage_IsOptionalAndBounded_SoAnEmptyOneIsAllowedAndALongOneIsNot', () => {
    expect(columnOf('FundraiserInvitation', 'PersonalMessage')).toBe('nvarchar|1000|YES');
  });

  test('ExpiresOnUtc_IsRequired_SoAnInvitationCannotBeWrittenWithoutAnEnd', () => {
    expect(columnOf('FundraiserInvitation', 'ExpiresOnUtc')).toContain('|NO');
  });
});

test.describe('The suppression list', () => {
  test('Table_Exists_WithTheColumnsAHeldBackSendNeeds', () => {
    expect(columnOf('EmailSuppression', 'EmailAddress')).toBe('nvarchar|256|NO');
    expect(columnOf('EmailSuppression', 'Reason')).toBe('nvarchar|32|NO');
    expect(columnOf('EmailSuppression', 'Detail')).toBe('nvarchar|500|YES');
  });

  test('OneAddressPerCharity_IsEnforcedByTheDatabaseRatherThanByWhicheverCallerRanLast', () => {
    insertSuppression();

    let refused = false;

    try {
      insertSuppression();
    } catch {
      refused = true;
    }

    expect(refused).toBe(true);
    expect(
      Number(
        querySingleValue(
          `SELECT COUNT(*) FROM EmailSuppression WHERE EmailAddress = '${PROBE_ADDRESS}';`,
        ),
      ),
    ).toBe(1);
  });
});

test.describe('The lifecycle email tables', () => {
  test('Template_Body_IsUnboundedSoALongEmailIsNotSilentlyTruncated', () => {
    expect(columnOf('PeerToPeerEmailTemplate', 'BodyHtml')).toBe('nvarchar|-1|NO');
  });

  test('OneTemplateOfEachKindPerCampaign_IsEnforcedByAUniqueIndex', () => {
    expect(uniqueIndexNames('PeerToPeerEmailTemplate')).toContain(
      'IX_PeerToPeerEmailTemplate_Campaign_Type',
    );
  });

  test('Dispatch_Table_RecordsWhichEmailWentToWhichFundraiser', () => {
    expect(columnOf('PeerToPeerEmailDispatch', 'CampaignFundraiserId')).not.toBe('missing');
    expect(columnOf('PeerToPeerEmailDispatch', 'TemplateType')).not.toBe('missing');
    expect(columnOf('PeerToPeerEmailDispatch', 'DispatchKey')).not.toBe('missing');
    expect(columnOf('PeerToPeerEmailDispatch', 'SentOnUtc')).not.toBe('missing');
  });

  test('OneSendPerFundraiserPerKey_IsRefusedBySchemaSoARecalculationCannotMailTwice', () => {
    insertDispatch('e2e-25');

    let refused = false;

    try {
      insertDispatch('e2e-25');
    } catch {
      refused = true;
    }

    expect(refused).toBe(true);
    expect(
      Number(
        querySingleValue(
          "SELECT COUNT(*) FROM PeerToPeerEmailDispatch WHERE DispatchKey = 'e2e-25';",
        ),
      ),
    ).toBe(1);
  });

  test('ADifferentMilestone_IsAllowedBecauseItIsADifferentSend', () => {
    insertDispatch('e2e-25');
    insertDispatch('e2e-50');

    expect(
      Number(
        querySingleValue(
          "SELECT COUNT(*) FROM PeerToPeerEmailDispatch WHERE DispatchKey LIKE 'e2e-%';",
        ),
      ),
    ).toBe(2);
  });

  test('Dispatch_HasNoSoftDeleteColumn_SoAClaimCannotBeQuietlyRetiredAndResent', () => {
    expect(columnOf('PeerToPeerEmailDispatch', 'IsDeleted')).toBe('missing');
  });
});
