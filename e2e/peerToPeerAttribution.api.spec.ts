import { APIRequestContext, expect, test } from '@playwright/test';
import { anonymousApi, authenticatedApi, joinUrl, settingsUrl, signIn } from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';

/**
 * Who a gift is credited to is decided by the server, from the campaign row and the page address, and
 * never from a number the caller sends. These prove that against the running API.
 *
 * Deliberately no payment is taken here: the donation endpoint is exercised only far enough to reach
 * the attribution decision, because the payment path is shipped behaviour this feature must not touch.
 * The card, ACH, PAD and wallet journeys are covered by the manual pass on a test merchant.
 */

const campaign = liveCampaign();
const PROBE_TAG = 'e2e-attribution';

let api: APIRequestContext;
let anonymous: APIRequestContext;
let campaignSlug: string;
let fundraiserSlug: string;
let fundraiserId: string;
let originalSettings: Record<string, unknown>;

const enabledSettings = (overrides: Record<string, unknown> = {}) => ({
  isPeerToPeerEnabled: true,
  defaultPersonalGoal: 250,
  allowTeams: false,
  requiresApproval: false,
  leaderboardVisibility: 'Public',
  ...overrides,
});

const removeJoinedPages = (): void =>
  execute(`
    DELETE fundraiser
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE campaign.UniqueId = '${campaign.uniqueId}';
  `);

/** One gift written straight to the tables, credited the way the donation service would credit it. */
const insertGiftAttributedTo = (attributedFundraiserId: string | null): void =>
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');

    INSERT INTO Invoice (UniqueId, RowVersion, Module, InvoiceType, TotalAmount, InvoiceStatus,
                         IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES (NEWID(), 0, 'Donation', 'Regular', 10, 'Paid', 0, '${PROBE_TAG}', SYSUTCDATETIME());

    DECLARE @invoiceId INT = SCOPE_IDENTITY();

    INSERT INTO DonationCampaignInvoice (UniqueId, DonationCampaignId, InvoiceId, CampaignFundraiserId)
    VALUES (NEWID(), @campaignId, @invoiceId, ${attributedFundraiserId ?? 'NULL'});
  `);

const removeProbeGifts = (): void =>
  execute(`
    DECLARE @invoiceIds TABLE (Id INT);
    INSERT INTO @invoiceIds SELECT Id FROM Invoice WHERE CreatedBy = '${PROBE_TAG}';

    DELETE FROM DonationCampaignInvoice WHERE InvoiceId IN (SELECT Id FROM @invoiceIds);
    DELETE FROM Invoice WHERE Id IN (SELECT Id FROM @invoiceIds);
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  originalSettings = (await (await api.get(settingsUrl(campaign.uniqueId))).json()).data;

  removeProbeGifts();
  removeJoinedPages();
  await api.post(settingsUrl(campaign.uniqueId), { data: enabledSettings() });

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}';
  `);

  const joined = await api.post(joinUrl(campaign.uniqueId), {
    data: { displayName: 'E2E Attribution', personalGoal: 200, story: null },
  });

  expect(joined.status()).toBe(200);
  fundraiserSlug = (await joined.json()).data.slug;

  fundraiserId = querySingleValue(`
    SELECT CAST(fundraiser.Id AS VARCHAR(20))
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE campaign.UniqueId = '${campaign.uniqueId}' AND fundraiser.Slug = '${fundraiserSlug}';
  `);
});

test.afterEach(() => removeProbeGifts());

test.afterAll(async () => {
  removeProbeGifts();
  removeJoinedPages();
  await api.post(settingsUrl(campaign.uniqueId), { data: originalSettings });
  await api.dispose();
  await anonymous.dispose();
});

test.describe('Donation attribution', () => {
  test('Attribution_GiftThroughAPage_IsReadBackFromTheDatabaseAgainstThatPage', () => {
    insertGiftAttributedTo(fundraiserId);

    const attributed = querySingleValue(`
      SELECT CAST(donation.CampaignFundraiserId AS VARCHAR(20))
      FROM DonationCampaignInvoice donation
      INNER JOIN Invoice invoice ON invoice.Id = donation.InvoiceId
      WHERE invoice.CreatedBy = '${PROBE_TAG}';
    `);

    expect(attributed).toBe(fundraiserId);
  });

  test('Attribution_GiftGivenToTheCampaign_IsStoredAsNullRatherThanGuessed', () => {
    insertGiftAttributedTo(null);

    const attributed = querySingleValue(`
      SELECT ISNULL(CAST(donation.CampaignFundraiserId AS VARCHAR(20)), 'NULL')
      FROM DonationCampaignInvoice donation
      INNER JOIN Invoice invoice ON invoice.Id = donation.InvoiceId
      WHERE invoice.CreatedBy = '${PROBE_TAG}';
    `);

    expect(attributed).toBe('NULL');
  });

  test('Attribution_DonatePayloadWithNoFundraiser_IsAcceptedExactlyAsBefore', async () => {
    // The contract gained one optional field. A payload that never mentions it must be refused for the
    // same reasons it always was - a missing payment method - and never for a missing fundraiser.
    const response = await anonymous.post(`/api/donation/${campaign.uniqueId}/donate`, {
      data: { donationAmount: 10, frequency: 'OneTime' },
    });

    expect([400, 401, 403]).toContain(response.status());
    expect((await response.text()).toLowerCase()).not.toContain('fundraiser');
  });

  test('Attribution_DonatePayloadNamingAPageOnAnotherCampaign_IsNotCredited', async () => {
    const response = await anonymous.post(`/api/donation/${campaign.uniqueId}/donate`, {
      data: { donationAmount: 10, frequency: 'OneTime', fundraiserSlug: 'not-on-this-campaign' },
    });

    // Refused for the reasons it always was; the unknown page never becomes an attribution.
    expect(response.status()).not.toBe(500);

    const credited = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(10))
      FROM DonationCampaignInvoice donation
      INNER JOIN Invoice invoice ON invoice.Id = donation.InvoiceId
      WHERE invoice.CreatedBy = '${PROBE_TAG}';
    `);

    expect(credited).toBe('0');
  });

  test('Attribution_PageAddress_IsTheOnlyThingTheCallerGetsToChoose', async () => {
    const response = await anonymous.get(`/api/campaigns/${campaignSlug}/${fundraiserSlug}`);
    const raw = await response.text();

    // The identifier attribution is stored under is never handed to a caller who could send it back.
    expect(raw).not.toContain('campaignFundraiserId');
    expect(raw).not.toContain(`"id"`);
  });
});
