import { APIRequestContext, expect, test } from '@playwright/test';
import {
  anonymousApi,
  authenticatedApi,
  fundraiserPageUrl,
  joinUrl,
  settingsUrl,
  signIn,
} from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { clearFundraiserPages } from './support/fundraiserPages';

/**
 * The fundraiser page is the only endpoint in this feature a stranger can reach, so what it refuses to
 * say matters as much as what it returns. Every page and every probe row this suite writes is removed
 * afterwards, keyed on the campaign under test.
 */

let api: APIRequestContext;
let anonymous: APIRequestContext;
let campaignUniqueId: string;
let campaignSlug: string;
let fundraiserSlug: string;
let originalSettings: Record<string, unknown>;

const enabledSettings = (overrides: Record<string, unknown> = {}) => ({
  isPeerToPeerEnabled: true,
  defaultPersonalGoal: 250,
  allowTeams: false,
  requiresApproval: false,
  leaderboardVisibility: 'Public',
  ...overrides,
});

const removeJoinedPages = (): void => clearFundraiserPages(campaignUniqueId);

const setPageStatus = (status: string): void =>
  execute(`
    UPDATE fundraiser
    SET CurrentStatus = '${status}'
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE campaign.UniqueId = '${campaignUniqueId}' AND fundraiser.Slug = '${fundraiserSlug}';
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  campaignUniqueId = liveCampaign().uniqueId;
  originalSettings = (await (await api.get(settingsUrl(campaignUniqueId))).json()).data;

  removeJoinedPages();
  await api.post(settingsUrl(campaignUniqueId), { data: enabledSettings() });

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaignUniqueId}';
  `);

  const joined = await api.post(joinUrl(campaignUniqueId), {
    data: { displayName: 'E2E Public Page', personalGoal: 400, story: 'Written by the e2e suite.' },
  });

  expect(joined.status()).toBe(200);
  fundraiserSlug = (await joined.json()).data.slug;
});

test.afterAll(async () => {
  removeJoinedPages();
  await api.post(settingsUrl(campaignUniqueId), { data: originalSettings });
  await api.dispose();
  await anonymous.dispose();
});

test.describe('Public fundraiser page endpoint', () => {
  test('Page_SignedOutVisitor_CanReadALivePageWithoutAToken', async () => {
    const response = await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug));

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data.state).toBe('Available');
    expect(body.data.displayName).toBe('E2E Public Page');
  });

  test('Page_AnyResponse_CarriesNoEmailAddressAndNoUserIdentifier', async () => {
    const response = await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug));
    const raw = await response.text();

    expect(raw.toLowerCase()).not.toContain('userid');
    expect(raw.toLowerCase()).not.toContain('email');
    expect(raw).not.toContain('@');
  });

  test('Page_UnknownFundraiserSlug_IsRefusedWithoutRevealingWhetherItExists', async () => {
    const response = await anonymous.get(fundraiserPageUrl(campaignSlug, 'no-such-supporter'));

    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Fundraising page not found.');
  });

  test('Page_UnknownCampaignSlug_IsRefusedWithTheSameSentence', async () => {
    const unknownCampaign = await anonymous.get(
      fundraiserPageUrl('no-such-campaign', fundraiserSlug),
    );
    const unknownFundraiser = await anonymous.get(
      fundraiserPageUrl(campaignSlug, 'no-such-supporter'),
    );

    expect(await (await unknownCampaign.json()).message).toBe(
      (await unknownFundraiser.json()).message,
    );
  });

  test('Page_ErrorResponse_CarriesNoStackTraceAndNoFrameworkDetail', async () => {
    const response = await anonymous.get(fundraiserPageUrl(campaignSlug, 'no-such-supporter'));
    const raw = await response.text();

    expect(raw).not.toContain('Ideas.');
    expect(raw).not.toContain('   at ');
    expect(raw).not.toContain('Microsoft.');
  });

  test('Page_WaitingForApproval_SaysSoAndPublishesNeitherTheStoryNorATotal', async () => {
    setPageStatus('PendingApproval');

    const body = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();

    expect(body.data.state).toBe('AwaitingApproval');
    expect(body.data.story).toBeNull();
    expect(body.data.raisedAmount).toBe(0);

    setPageStatus('Active');
  });

  test('Page_Withdrawn_ReportsClosedRatherThanMissing', async () => {
    setPageStatus('Paused');

    const body = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();

    expect(body.data.state).toBe('Closed');

    setPageStatus('Active');
  });

  test('Page_PeerToPeerSwitchedBackOff_StopsOfferingTheDonateSurface', async () => {
    await api.post(settingsUrl(campaignUniqueId), {
      data: enabledSettings({ isPeerToPeerEnabled: false }),
    });

    const body = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();

    expect(body.data.state).toBe('CampaignEnded');

    await api.post(settingsUrl(campaignUniqueId), { data: enabledSettings() });
  });

  test('Page_LivePageWithNoDonations_ReportsZeroRatherThanFailing', async () => {
    const body = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();

    expect(body.data.raisedAmount).toBe(0);
    expect(body.data.donorCount).toBe(0);
    expect(body.data.recentSupporters).toEqual([]);
  });

  test('Page_LivePage_CarriesTheGoalTheSupporterChose', async () => {
    const body = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();

    expect(body.data.goal).toBe(400);
  });
});
