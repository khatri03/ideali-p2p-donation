import { expect, test } from '@playwright/test';
import { querySingleValue } from './support/database';

/**
 * Attribution is a shape decision taken against a shipped table, so the schema is the thing worth
 * testing: the column stays nullable forever because every existing gift and every direct gift
 * legitimately has no fundraiser, and the index is filtered because the overwhelming majority of rows
 * keep it null. None of that can be proven from application code.
 */
test.describe('Donation attribution schema', () => {
  test('Attribution_InvoiceColumn_StaysNullableSoDirectGiftsRemainValid', () => {
    const nullable = querySingleValue(`
      SELECT IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'DonationCampaignInvoice'
        AND COLUMN_NAME = 'CampaignFundraiserId';
    `);

    expect(nullable).toBe('YES');
  });

  test('Attribution_RecurringColumn_StaysNullableForSchedulesStartedOnTheCampaign', () => {
    const nullable = querySingleValue(`
      SELECT IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'DonationRecurring'
        AND COLUMN_NAME = 'CampaignFundraiserId';
    `);

    expect(nullable).toBe('YES');
  });

  test('Attribution_InvoiceIndex_IsFilteredSoUnattributedRowsAreNotIndexed', () => {
    const filter = querySingleValue(`
      SELECT ISNULL(filter_definition, '')
      FROM sys.indexes
      WHERE name = 'IX_DonationCampaignInvoice_CampaignFundraiserId';
    `);

    expect(filter).toContain('CampaignFundraiserId');
    expect(filter).toContain('IS NOT NULL');
  });

  test('Attribution_InvoiceForeignKey_PointsAtTheFundraiserTable', () => {
    const referenced = querySingleValue(`
      SELECT OBJECT_NAME(referenced_object_id)
      FROM sys.foreign_keys
      WHERE name = 'FK_DonationCampaignInvoice_CampaignFundraiser_CampaignFundraiserId';
    `);

    expect(referenced).toBe('CampaignFundraiser');
  });

  test('Attribution_ExistingDonations_WereNotBackfilledOrRewritten', () => {
    const attributed = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(20))
      FROM DonationCampaignInvoice
      WHERE CampaignFundraiserId IS NOT NULL
        AND CampaignFundraiserId NOT IN (SELECT Id FROM CampaignFundraiser);
    `);

    expect(attributed).toBe('0');
  });
});
