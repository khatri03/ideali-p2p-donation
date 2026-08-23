import { execute } from './database';

/**
 * Clears the fundraising pages on one campaign so a spec starts from a known state.
 *
 * A page that has money credited to it cannot be deleted - the attribution foreign key is deliberately
 * Restrict, so a gift never loses the page it was given through - and a test has no business destroying
 * a real donation record to make room for itself. Such a page is soft-deleted instead: the filtered
 * unique indexes only cover live rows, so the slug and the "one page per person per campaign" slot are
 * both released, and the gift keeps pointing where it always did.
 */
export const clearFundraiserPages = (campaignUniqueId: string): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaignUniqueId}');

    UPDATE fundraiser
    SET IsDeleted = 1
    FROM CampaignFundraiser fundraiser
    WHERE fundraiser.DonationCampaignId = @campaignId
      AND EXISTS (
        SELECT 1 FROM DonationCampaignInvoice donation
        WHERE donation.CampaignFundraiserId = fundraiser.Id
      );

    DELETE fundraiser
    FROM CampaignFundraiser fundraiser
    WHERE fundraiser.DonationCampaignId = @campaignId
      AND NOT EXISTS (
        SELECT 1 FROM DonationCampaignInvoice donation
        WHERE donation.CampaignFundraiserId = fundraiser.Id
      );
  `);
