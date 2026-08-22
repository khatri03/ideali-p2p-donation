import { expect, test } from '@playwright/test';
import { execute, query, querySingleValue } from './support/database';

/**
 * A campaign slug is the first segment of every fundraiser address on that campaign, so two campaigns
 * sharing one would make a supporter's address ambiguous. Uniqueness lives in the database because a
 * service-level check cannot survive two organisers switching the feature on at the same moment.
 */

const SLUG = 'e2e-campaign-slug-probe';

let firstCampaignId: string;
let secondCampaignId: string;
let originalSlugs: Array<[string, string]> = [];

const setSlug = (campaignId: string, slug: string | null): void =>
  execute(`
    UPDATE DonationCampaign
    SET PeerToPeerSlug = ${slug === null ? 'NULL' : `'${slug}'`}
    WHERE Id = ${campaignId};
  `);

test.beforeAll(() => {
  const rows = query(`
    SELECT TOP 2 CAST(Id AS VARCHAR(20)) + '|' + ISNULL(PeerToPeerSlug, '')
    FROM DonationCampaign
    WHERE IsDeleted = 0
    ORDER BY Id DESC;
  `);

  if (rows.length < 2) {
    throw new Error('Two campaigns are needed to prove campaign slug uniqueness. Seed another.');
  }

  originalSlugs = rows.map((row) => {
    const [id, slug] = row.split('|');
    return [id, slug] as [string, string];
  });

  [firstCampaignId, secondCampaignId] = originalSlugs.map(([id]) => id);
});

test.afterAll(() => {
  for (const [id, slug] of originalSlugs) {
    setSlug(id, slug === '' ? null : slug);
  }
});

test.describe('Campaign peer-to-peer slug uniqueness', () => {
  test('CampaignSlug_TakenByAnotherCampaign_IsRejectedByTheDatabase', () => {
    setSlug(firstCampaignId, SLUG);

    expect(() => setSlug(secondCampaignId, SLUG)).toThrow(/UX_DonationCampaign_PeerToPeerSlug/);
  });

  test('CampaignSlug_LeftUnsetOnManyCampaigns_IsNotTreatedAsACollision', () => {
    setSlug(firstCampaignId, null);

    expect(() => setSlug(secondCampaignId, null)).not.toThrow();
  });

  test('CampaignSlug_UniquenessIndex_IsFilteredInTheLiveSchema', () => {
    const rows = query(`
      SELECT name + ' ' + ISNULL(filter_definition, 'none')
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('DonationCampaign')
        AND name = 'UX_DonationCampaign_PeerToPeerSlug'
        AND is_unique = 1;
    `);

    expect(rows).toEqual([
      'UX_DonationCampaign_PeerToPeerSlug ([PeerToPeerSlug] IS NOT NULL AND [IsDeleted]=(0))',
    ]);
  });

  test('CampaignSlug_Column_IsNullableSoShippedCampaignsWereNotBackfilled', () => {
    const nullable = querySingleValue(`
      SELECT CASE WHEN is_nullable = 1 THEN 'nullable' ELSE 'not null' END
      FROM sys.columns
      WHERE object_id = OBJECT_ID('DonationCampaign') AND name = 'PeerToPeerSlug';
    `);

    expect(nullable).toBe('nullable');
  });
});
