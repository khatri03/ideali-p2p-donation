import { expect, test } from '@playwright/test';
import { execute, query, querySingleValue } from './support/database';

/**
 * Two rules stop a supporter page being duplicated, and both live in the database rather than in
 * application code: a slug is unique per campaign, and one person raises money once per campaign. A
 * service-level check cannot replace either - two concurrent joins would both pass it. These exercise
 * the real indexes on the real database, which is the only place the filter on IsDeleted can be proven.
 */

const SLUG = 'e2e-uniqueness-probe';
const OTHER_SLUG = 'e2e-uniqueness-probe-second';

let campaignId: string;
let organizerId: string;

const insertFundraiser = (slug: string, userId: string, isDeleted: 0 | 1 = 0): void =>
  execute(`
    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, ${organizerId}, ${campaignId}, ${userId}, '${slug}', 'E2E Probe', 'Created by the e2e suite.',
       100, 'Pending', ${isDeleted}, 'e2e', SYSUTCDATETIME());
  `);

const removeProbes = (): void =>
  execute(`DELETE FROM CampaignFundraiser WHERE CreatedBy = 'e2e';`);

test.beforeAll(() => {
  const row = querySingleValue(`
    SELECT TOP 1 CAST(Id AS VARCHAR(20)) + '|' + CAST(OrganizerId AS VARCHAR(20))
    FROM DonationCampaign
    WHERE IsDeleted = 0
    ORDER BY Id DESC;
  `);

  [campaignId, organizerId] = row.split('|');
  removeProbes();
});

test.afterEach(() => removeProbes());

test.describe('CampaignFundraiser uniqueness', () => {
  test('Fundraiser_SecondPageWithTheSameSlugOnTheSameCampaign_IsRejectedByTheDatabase', () => {
    insertFundraiser(SLUG, '1');

    expect(() => insertFundraiser(SLUG, '2')).toThrow(/UX_CampaignFundraiser_Campaign_Slug/);
  });

  test('Fundraiser_SlugFreedBySoftDelete_CanBeClaimedAgain', () => {
    insertFundraiser(SLUG, '1');
    execute(`UPDATE CampaignFundraiser SET IsDeleted = 1 WHERE Slug = '${SLUG}';`);

    expect(() => insertFundraiser(SLUG, '2')).not.toThrow();

    const live = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(10))
      FROM CampaignFundraiser
      WHERE Slug = '${SLUG}' AND IsDeleted = 0;
    `);

    expect(live).toBe('1');
  });

  test('Fundraiser_SamePersonRaisingTwiceForOneCampaign_IsRejectedByTheDatabase', () => {
    insertFundraiser(SLUG, '1');

    expect(() => insertFundraiser(OTHER_SLUG, '1')).toThrow(/UX_CampaignFundraiser_Campaign_User/);
  });

  test('Fundraiser_SamePersonAfterTheirPageIsSoftDeleted_CanRaiseAgain', () => {
    insertFundraiser(SLUG, '1');
    execute(`UPDATE CampaignFundraiser SET IsDeleted = 1 WHERE Slug = '${SLUG}';`);

    expect(() => insertFundraiser(OTHER_SLUG, '1')).not.toThrow();
  });

  test('Fundraiser_UniquenessIndexes_AreFilteredOnIsDeletedInTheLiveSchema', () => {
    const rows = query(`
      SELECT name + ' ' + ISNULL(filter_definition, 'none')
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('CampaignFundraiser')
        AND name IN ('UX_CampaignFundraiser_Campaign_Slug', 'UX_CampaignFundraiser_Campaign_User')
        AND is_unique = 1
      ORDER BY name;
    `);

    expect(rows).toEqual([
      'UX_CampaignFundraiser_Campaign_Slug ([IsDeleted]=(0))',
      'UX_CampaignFundraiser_Campaign_User ([IsDeleted]=(0))',
    ]);
  });
});
