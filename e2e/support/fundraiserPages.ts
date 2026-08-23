import { execute, query } from './database';

/**
 * The join specs need the signed-in account to own no fundraising page on the campaign under test,
 * and that account is a real one that people also use by hand. Clearing the campaign outright is
 * therefore destructive: a page somebody created through the browser disappears, and the join screen
 * offers them the setup form again as though they had never joined.
 *
 * So the pages that existed before the run are only hidden - the filtered unique indexes cover live
 * rows alone, so the address and the "one page per person per campaign" slot are both released - and
 * restoreFundraiserPages puts them back. Everything the run itself creates is removed outright, so a
 * suite that runs twice does not leave a second copy of its own page behind for the next run to trip
 * over. A page that a gift already points at cannot be removed - the attribution foreign key is
 * deliberately Restrict, so a donation never loses the page it was given through - and is hidden
 * instead.
 */
let hiddenBeforeTheRun: string[] | null = null;

const campaignPagesFilter = (campaignUniqueId: string) => `
  fundraiser.DonationCampaignId = (
    SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaignUniqueId}'
  )`;

const livePageIds = (campaignUniqueId: string): string[] =>
  query(`
    SELECT CAST(fundraiser.Id AS VARCHAR(20))
    FROM CampaignFundraiser fundraiser
    WHERE ${campaignPagesFilter(campaignUniqueId)} AND fundraiser.IsDeleted = 0;
  `);

const setDeleted = (ids: string[], isDeleted: 0 | 1): void => {
  if (!ids.length) return;

  execute(`UPDATE CampaignFundraiser SET IsDeleted = ${isDeleted} WHERE Id IN (${ids.join(',')});`);
};

/** Everything on the campaign that the run created: removed if no gift points at it, hidden if one does. */
const discardPagesTheRunCreated = (campaignUniqueId: string, keep: string[]): void => {
  const kept = keep.length ? keep.join(',') : '0';

  execute(`
    UPDATE fundraiser SET IsDeleted = 1
    FROM CampaignFundraiser fundraiser
    WHERE ${campaignPagesFilter(campaignUniqueId)}
      AND fundraiser.Id NOT IN (${kept})
      AND EXISTS (
        SELECT 1 FROM DonationCampaignInvoice donation
        WHERE donation.CampaignFundraiserId = fundraiser.Id
      );

    DELETE fundraiser
    FROM CampaignFundraiser fundraiser
    WHERE ${campaignPagesFilter(campaignUniqueId)}
      AND fundraiser.Id NOT IN (${kept})
      AND NOT EXISTS (
        SELECT 1 FROM DonationCampaignInvoice donation
        WHERE donation.CampaignFundraiserId = fundraiser.Id
      );
  `);
};

/** Leaves one campaign with no live fundraising page, without destroying anybody's real one. */
export const clearFundraiserPages = (campaignUniqueId: string): void => {
  hiddenBeforeTheRun ??= livePageIds(campaignUniqueId);

  discardPagesTheRunCreated(campaignUniqueId, hiddenBeforeTheRun);
  setDeleted(hiddenBeforeTheRun, 1);
};

/**
 * Puts back the pages that existed before the first clear, once everything the run created is gone.
 * Safe to call when nothing was hidden.
 */
export const restoreFundraiserPages = (): void => {
  const baseline = hiddenBeforeTheRun ?? [];
  hiddenBeforeTheRun = null;

  if (!baseline.length) return;

  const campaignUniqueIds = query(`
    SELECT DISTINCT CAST(campaign.UniqueId AS VARCHAR(50))
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE fundraiser.Id IN (${baseline.join(',')});
  `);

  campaignUniqueIds.forEach((uniqueId) => discardPagesTheRunCreated(uniqueId, baseline));

  setDeleted(baseline, 0);
};
