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
/**
 * The lifecycle job records every supporter email it sends, and that record points at the page it was
 * sent about with a Restrict foreign key - deliberately, so a sent email can never lose the page it
 * describes. A probe page the job has since written about therefore cannot be deleted until its trail
 * is cleared, which every cleanup in this suite does first. Scoped to probe pages, so a real
 * supporter's trail is never touched.
 *
 * A page inserted straight into the table carries the probe tag in CreatedBy; one the suite made by
 * joining through the API carries the signed-in account's name instead, and is recognisable only by
 * its address. Both are matched, because a trail left behind blocks the page it points at from ever
 * being removed.
 */
export const PROBE_LIFECYCLE_TRAIL_SQL = `
  DELETE dispatch FROM PeerToPeerEmailDispatch dispatch
  INNER JOIN CampaignFundraiser fundraiser ON fundraiser.Id = dispatch.CampaignFundraiserId
  WHERE fundraiser.CreatedBy LIKE 'e2e%' OR fundraiser.Slug LIKE 'e2e-%';
`;

let hiddenBeforeTheRun: string[] | null = null;

/**
 * The campaigns this run cleared. Remembered separately from the hidden pages, because a campaign that
 * had no live page to begin with hides nothing and would otherwise be forgotten - leaving the page the
 * run created behind to occupy the "one page per person per campaign" slot for every later spec.
 */
const clearedCampaignUniqueIds = new Set<string>();

const campaignPagesFilter = (campaignUniqueId: string) => `
  fundraiser.DonationCampaignId = (
    SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaignUniqueId}'
  )`;

/**
 * The pages to put back afterwards: the ones a real person made, never one this suite left behind.
 *
 * A run that is cut short - a max-failures stop, a killed terminal - never reaches its cleanup, so its
 * own page is still live when the next run starts. Adopting that page as the baseline preserved it for
 * good, and it went on holding the "one page per person per campaign" slot until somebody deleted the
 * row by hand. Suite pages are named after their probe, so they are excluded and discarded instead.
 */
const livePageIds = (campaignUniqueId: string): string[] =>
  query(`
    SELECT CAST(fundraiser.Id AS VARCHAR(20))
    FROM CampaignFundraiser fundraiser
    WHERE ${campaignPagesFilter(campaignUniqueId)}
      AND fundraiser.IsDeleted = 0
      AND fundraiser.Slug NOT LIKE 'e2e-%';
  `);

const setDeleted = (ids: string[], isDeleted: 0 | 1): void => {
  if (!ids.length) return;

  execute(`UPDATE CampaignFundraiser SET IsDeleted = ${isDeleted} WHERE Id IN (${ids.join(',')});`);
};

/** Everything on the campaign that the run created: removed if no gift points at it, hidden if one does. */
const discardPagesTheRunCreated = (campaignUniqueId: string, keep: string[]): void => {
  const kept = keep.length ? keep.join(',') : '0';

  execute(`
    ${PROBE_LIFECYCLE_TRAIL_SQL}

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
  clearedCampaignUniqueIds.add(campaignUniqueId);

  discardPagesTheRunCreated(campaignUniqueId, hiddenBeforeTheRun);
  setDeleted(hiddenBeforeTheRun, 1);
};

/**
 * Puts back the pages that existed before the first clear, once everything the run created is gone.
 * Safe to call when nothing was hidden.
 *
 * The discard runs against every campaign the run cleared, not only the ones that had a page to hide.
 * A campaign that started empty hides nothing, and skipping it left the page this run created alive:
 * it then held the "one page per person per campaign" slot, and every later spec inserting a page for
 * the same account on the same campaign was refused by the unique index.
 */
export const restoreFundraiserPages = (): void => {
  const baseline = hiddenBeforeTheRun ?? [];
  hiddenBeforeTheRun = null;

  const campaignUniqueIds = new Set(clearedCampaignUniqueIds);
  clearedCampaignUniqueIds.clear();

  if (baseline.length) {
    query(`
      SELECT DISTINCT CAST(campaign.UniqueId AS VARCHAR(50))
      FROM CampaignFundraiser fundraiser
      INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
      WHERE fundraiser.Id IN (${baseline.join(',')});
    `).forEach((uniqueId) => campaignUniqueIds.add(uniqueId));
  }

  campaignUniqueIds.forEach((uniqueId) => discardPagesTheRunCreated(uniqueId, baseline));

  setDeleted(baseline, 0);
};
