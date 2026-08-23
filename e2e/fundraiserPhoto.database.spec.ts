import { expect, test } from '@playwright/test';
import { querySingleValue } from './support/database';

/**
 * The photo column exists in the schema rather than only in the model. Read straight from the catalog
 * views: a migration that did not run, or ran differently in this environment, fails here rather than
 * as a confusing 500 the first time somebody uploads a picture.
 */

test.describe('Fundraiser photo column', () => {
  test('Photo_Column_IsNullableSoAPageWithoutOneIsStillValid', () => {
    const nullable = querySingleValue(`
      SELECT CAST(is_nullable AS VARCHAR(1))
      FROM sys.columns
      WHERE object_id = OBJECT_ID('dbo.CampaignFundraiser') AND name = 'PhotoFileStorageId';
    `);

    expect(nullable).toBe('1');
  });

  test('Photo_Column_PointsAtTheSharedFileStorageTable', () => {
    const referenced = querySingleValue(`
      SELECT OBJECT_NAME(referenced_object_id)
      FROM sys.foreign_keys
      WHERE name = 'FK_CampaignFundraiser_FileStorage_PhotoFileStorageId';
    `);

    expect(referenced).toBe('FileStorage');
  });

  /** Restrict, never cascade: deleting a stored file must not take a live fundraising page with it. */
  test('Photo_ForeignKey_RefusesToDeleteAPageBecauseAFileWentAway', () => {
    const deleteRule = querySingleValue(`
      SELECT delete_referential_action_desc
      FROM sys.foreign_keys
      WHERE name = 'FK_CampaignFundraiser_FileStorage_PhotoFileStorageId';
    `);

    expect(deleteRule).toBe('NO_ACTION');
  });

  test('Photo_Column_IsIndexedSoTheJoinDoesNotScanEveryPage', () => {
    const indexed = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(10))
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('dbo.CampaignFundraiser')
        AND name = 'IX_CampaignFundraiser_PhotoFileStorageId';
    `);

    expect(indexed).toBe('1');
  });
});
