import { expect, test } from '@playwright/test';
import { execute, query, querySingleValue } from './support/database';

/**
 * The schema behind oversight. These are rules the API cannot enforce on its own: the columns the
 * audit trail is made of, the indexes it is read through, and the fact that hiding a team is a
 * different column from a captain disbanding one.
 *
 * Everything this suite writes is removed afterwards.
 */

const PROBE_SUBJECT = 'E2E Schema Subject';

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

const removeProbeRows = (): void =>
  execute(`DELETE FROM PeerToPeerModerationEntry WHERE SubjectName = '${PROBE_SUBJECT}';`);

const insertProbeEntry = (action: string, reason: string | null): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT MIN(Id) FROM DonationCampaign WHERE IsDeleted = 0);
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);
    DECLARE @userId INT = (SELECT MIN(Id) FROM [User]);

    INSERT INTO PeerToPeerModerationEntry
      (UniqueId, OrganizerId, DonationCampaignId, Subject, SubjectId, SubjectName, Action, Reason,
       ActedByUserId, ActedByName, ActedOnUtc)
    VALUES
      (NEWID(), @organizerId, @campaignId, 'Fundraiser', 1, '${PROBE_SUBJECT}', '${action}',
       ${reason === null ? 'NULL' : `'${reason}'`}, @userId, 'E2E Schema Actor', SYSUTCDATETIME());
  `);

test.beforeEach(() => removeProbeRows());
test.afterAll(() => removeProbeRows());

test.describe('The moderation trail', () => {
  test('Table_Exists_WithTheColumnsAnAuditReaderNeeds', () => {
    expect(columnOf('PeerToPeerModerationEntry', 'Subject')).not.toBe('missing');
    expect(columnOf('PeerToPeerModerationEntry', 'SubjectId')).not.toBe('missing');
    expect(columnOf('PeerToPeerModerationEntry', 'Action')).not.toBe('missing');
    expect(columnOf('PeerToPeerModerationEntry', 'ActedByUserId')).not.toBe('missing');
    expect(columnOf('PeerToPeerModerationEntry', 'ActedOnUtc')).not.toBe('missing');
  });

  test('Table_HasNoSoftDeleteColumn_SoAnEntryCannotBeQuietlyRetired', () => {
    expect(columnOf('PeerToPeerModerationEntry', 'IsDeleted')).toBe('missing');
  });

  test('SubjectName_IsRequired_SoAnEntryCannotBeWrittenWithoutSayingWhoItIsAbout', () => {
    expect(columnOf('PeerToPeerModerationEntry', 'SubjectName')).toContain('|NO');
  });

  test('ActedByName_IsRequired_SoAnEntryCannotBeWrittenWithoutSayingWhoTookIt', () => {
    expect(columnOf('PeerToPeerModerationEntry', 'ActedByName')).toContain('|NO');
  });

  test('Reason_IsOptionalAndBoundedAt500_SoAnEmptyReasonIsAllowedAndALongOneIsNot', () => {
    expect(columnOf('PeerToPeerModerationEntry', 'Reason')).toBe('nvarchar|500|YES');
  });

  test('Reason_LongerThanTheColumn_IsRefusedByTheDatabaseItself', () => {
    let refused = false;

    try {
      insertProbeEntry('Hide', 'x'.repeat(501));
    } catch {
      refused = true;
    }

    expect(refused).toBe(true);
    expect(
      Number(
        querySingleValue(
          `SELECT COUNT(*) FROM PeerToPeerModerationEntry WHERE SubjectName = '${PROBE_SUBJECT}';`,
        ),
      ),
    ).toBe(0);
  });

  test('Entry_WithNoReason_IsAcceptedBecauseForcingOneProducesNonsense', () => {
    insertProbeEntry('Approve', null);

    expect(
      Number(
        querySingleValue(
          `SELECT COUNT(*) FROM PeerToPeerModerationEntry WHERE SubjectName = '${PROBE_SUBJECT}';`,
        ),
      ),
    ).toBe(1);
  });

  test('UniqueId_IsUnique_SoAnEntryCanBeAddressedWithoutExposingItsKey', () => {
    expect(
      indexNames('PeerToPeerModerationEntry').some((name) => name.includes('UniqueId')),
    ).toBe(true);
  });

  test('Indexes_CoverBothWaysTheTrailIsRead_ByCampaignAndBySubject', () => {
    const names = indexNames('PeerToPeerModerationEntry');

    expect(names).toContain('IX_PeerToPeerModerationEntry_Campaign_ActedOn');
    expect(names).toContain('IX_PeerToPeerModerationEntry_Subject_ActedOn');
  });
});

test.describe('Hiding a team', () => {
  test('IsHidden_ExistsOnCampaignTeam_AndIsRequiredWithADefault', () => {
    expect(columnOf('CampaignTeam', 'IsHidden')).toBe('bit|0|NO');
  });

  test('IsHidden_IsSeparateFromIsDeleted_SoADisbandedTeamAndAHiddenOneStayTellableApart', () => {
    expect(columnOf('CampaignTeam', 'IsDeleted')).toBe('bit|0|NO');
    expect(columnOf('CampaignTeam', 'IsHidden')).toBe('bit|0|NO');
  });

  test('IsHidden_OnEveryTeamThatExistedBeforeTheChange_DefaultedToShowing', () => {
    expect(
      Number(querySingleValue('SELECT COUNT(*) FROM CampaignTeam WHERE IsHidden IS NULL;')),
    ).toBe(0);
  });
});
