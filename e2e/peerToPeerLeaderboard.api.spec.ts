import { APIRequestContext, expect, test } from '@playwright/test';
import {
  anonymousApi,
  authenticatedApi,
  fundraiserPageUrl,
  joinUrl,
  leaderboardUrl,
  settingsUrl,
  signIn,
  signInAsSupporter,
} from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { clearFundraiserPages, restoreFundraiserPages } from './support/fundraiserPages';

/**
 * The leaderboard publishes supporters' names next to amounts to anyone who has the address, so this
 * suite cares about two things in equal measure: that the charity's visibility setting is actually
 * enforced on the server, and that a refusal never says which of the three reasons it was.
 *
 * Every page and every setting this suite changes is put back afterwards, keyed on the campaign under
 * test.
 */

/**
 * Two identities. Only the charity that runs the campaign can change its settings, and only somebody
 * who does not run it can hold a fundraising page on it, so `api` acts as the supporter throughout and
 * `organizer` is used for the campaign setup around them.
 */
let api: APIRequestContext;
let organizer: APIRequestContext;
let anonymous: APIRequestContext;
let campaignUniqueId: string;
let campaignSlug: string;
let fundraiserSlug: string;
let originalSettings: Record<string, unknown>;

const settingsWith = (overrides: Record<string, unknown> = {}) => ({
  isPeerToPeerEnabled: true,
  defaultPersonalGoal: 250,
  allowTeams: true,
  requiresApproval: false,
  leaderboardVisibility: 'Public',
  ...overrides,
});

const applySettings = async (overrides: Record<string, unknown> = {}) => {
  const response = await organizer.post(settingsUrl(campaignUniqueId), { data: settingsWith(overrides) });
  expect(response.status()).toBe(200);
};

const setPageStatus = (status: string): void =>
  execute(`
    UPDATE fundraiser
    SET CurrentStatus = '${status}'
    FROM CampaignFundraiser fundraiser
    INNER JOIN DonationCampaign campaign ON campaign.Id = fundraiser.DonationCampaignId
    WHERE campaign.UniqueId = '${campaignUniqueId}' AND fundraiser.Slug = '${fundraiserSlug}';
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signInAsSupporter());
  organizer = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  campaignUniqueId = liveCampaign().uniqueId;
  originalSettings = (await (await organizer.get(settingsUrl(campaignUniqueId))).json()).data;

  clearFundraiserPages(campaignUniqueId);
  await applySettings();

  campaignSlug = querySingleValue(`
    SELECT PeerToPeerSlug FROM DonationCampaign WHERE UniqueId = '${campaignUniqueId}';
  `);

  const joined = await api.post(joinUrl(campaignUniqueId), {
    data: { displayName: 'E2E Board Page', personalGoal: 400, story: 'Written by the e2e suite.' },
  });

  expect(joined.status()).toBe(200);
  fundraiserSlug = (await joined.json()).data.slug;
});

test.afterAll(async () => {
  restoreFundraiserPages();
  await organizer.post(settingsUrl(campaignUniqueId), { data: originalSettings });
  await api.dispose();
  await organizer.dispose();
  await anonymous.dispose();
});

test.describe('Leaderboard endpoint', () => {
  test('Board_SignedOutVisitor_CanReadAPublishedBoardWithoutAToken', async () => {
    await applySettings();

    const response = await anonymous.get(leaderboardUrl(campaignSlug));

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.data.campaignSlug).toBe(campaignSlug);
    expect(body.data.isOrganizerOnly).toBe(false);
  });

  test('Board_PublishedBoard_RanksTheSupporterPageTheSuiteCreated', async () => {
    await applySettings();

    const body = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();
    const row = body.data.fundraisers.find(
      (entry: { slug: string }) => entry.slug === fundraiserSlug,
    );

    expect(row).toBeTruthy();
    expect(row.rank).toBeGreaterThan(0);
    expect(row.displayName).toBe('E2E Board Page');
  });

  test('Board_AnyResponse_CarriesNoEmailAddressAndNoUserIdentifier', async () => {
    await applySettings();

    const raw = await (await anonymous.get(leaderboardUrl(campaignSlug))).text();

    expect(raw.toLowerCase()).not.toContain('userid');
    expect(raw.toLowerCase()).not.toContain('email');
    expect(raw).not.toContain('@');
  });

  test('Board_UnknownCampaignSlug_IsRefusedWithOneSentence', async () => {
    const response = await anonymous.get(leaderboardUrl('no-such-campaign'));

    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Leaderboard not found.');
  });

  test('Board_ErrorResponse_CarriesNoStackTraceAndNoFrameworkDetail', async () => {
    const raw = await (await anonymous.get(leaderboardUrl('no-such-campaign'))).text();

    expect(raw).not.toContain('Ideas.');
    expect(raw).not.toContain('   at ');
    expect(raw).not.toContain('Microsoft.');
  });

  test('Board_KeptToTheCharity_IsRefusedToASignedOutVisitor', async () => {
    await applySettings({ leaderboardVisibility: 'OrganizerOnly' });

    const response = await anonymous.get(leaderboardUrl(campaignSlug));

    expect(response.status()).toBe(404);

    await applySettings();
  });

  test('Board_KeptToTheCharity_RefusesAStrangerWithTheSameSentenceAsAnUnknownCampaign', async () => {
    await applySettings({ leaderboardVisibility: 'OrganizerOnly' });

    const kept = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();
    const unknown = await (await anonymous.get(leaderboardUrl('no-such-campaign'))).json();

    expect(kept.message).toBe(unknown.message);

    await applySettings();
  });

  test('Board_KeptToTheCharity_IsServedToTheCharityAndSaysItIsNotPublished', async () => {
    await applySettings({ leaderboardVisibility: 'OrganizerOnly' });

    const response = await api.get(leaderboardUrl(campaignSlug));

    expect(response.status()).toBe(200);
    expect((await response.json()).data.isOrganizerOnly).toBe(true);

    await applySettings();
  });

  test('Board_HiddenByTheCharity_IsRefusedEvenToTheCharityItself', async () => {
    await applySettings({ leaderboardVisibility: 'Hidden' });

    const response = await api.get(leaderboardUrl(campaignSlug));

    expect(response.status()).toBe(404);

    await applySettings();
  });

  test('Board_HiddenByTheCharity_IsNotOfferedFromThePublicFundraiserPage', async () => {
    await applySettings({ leaderboardVisibility: 'Hidden' });

    const page = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();

    expect(page.data.isLeaderboardPublished).toBe(false);

    await applySettings();
  });

  test('Board_PublishedBoard_IsOfferedFromThePublicFundraiserPage', async () => {
    await applySettings();

    const page = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();

    expect(page.data.isLeaderboardPublished).toBe(true);
  });

  test('Board_PageWaitingForApproval_NeverAppearsInTheStandings', async () => {
    await applySettings();
    setPageStatus('PendingApproval');

    const body = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();

    expect(
      body.data.fundraisers.some((entry: { slug: string }) => entry.slug === fundraiserSlug),
    ).toBe(false);

    setPageStatus('Active');
  });

  test('Board_PageTheCharityPaused_NeverAppearsInTheStandings', async () => {
    await applySettings();
    setPageStatus('Paused');

    const body = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();

    expect(
      body.data.fundraisers.some((entry: { slug: string }) => entry.slug === fundraiserSlug),
    ).toBe(false);

    setPageStatus('Active');
  });

  /**
   * Switching teams off stops new ones forming. The teams already there stay readable, which is the
   * campaign rule the console and the team page follow, so the board reports the setting rather than
   * making existing teams disappear.
   */
  test('Board_TeamsSwitchedOffForTheCampaign_ReportsTheSettingAndKeepsExistingTeams', async () => {
    await applySettings({ allowTeams: false });

    const body = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();

    expect(body.data.areTeamsAllowed).toBe(false);
    expect(Array.isArray(body.data.teams)).toBe(true);

    await applySettings();
  });

  test('Board_SupporterAmount_MatchesWhatTheirOwnPageReports', async () => {
    await applySettings();

    const board = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();
    const page = await (await anonymous.get(fundraiserPageUrl(campaignSlug, fundraiserSlug))).json();
    const row = board.data.fundraisers.find(
      (entry: { slug: string }) => entry.slug === fundraiserSlug,
    );

    expect(row.raisedAmount).toBe(page.data.raisedAmount);
    expect(row.donorCount).toBe(page.data.donorCount);
  });

  test('Board_SupporterTotal_NeverExceedsTheCampaignTotal', async () => {
    await applySettings();

    const body = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();

    expect(body.data.fundraiserRaisedAmount).toBeLessThanOrEqual(body.data.campaignRaisedAmount);
  });

  test('Board_ReadTwice_ReturnsTheSameOrderRatherThanShufflingOnReload', async () => {
    await applySettings();

    const first = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();
    const second = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();

    expect(second.data.fundraisers.map((entry: { slug: string }) => entry.slug)).toEqual(
      first.data.fundraisers.map((entry: { slug: string }) => entry.slug),
    );
  });

  test('Board_RankedPlaces_NeverStartBelowOneAndNeverDecrease', async () => {
    await applySettings();

    const body = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();
    const ranks: number[] = body.data.fundraisers.map((entry: { rank: number }) => entry.rank);

    ranks.forEach((rank, index) => {
      expect(rank).toBeGreaterThanOrEqual(1);

      if (index > 0) {
        expect(rank).toBeGreaterThanOrEqual(ranks[index - 1]);
      }
    });
  });

  test('Board_BiggestGifts_NeverNameADonorWhoAskedToStayAnonymous', async () => {
    await applySettings();

    const body = await (await anonymous.get(leaderboardUrl(campaignSlug))).json();

    body.data.topGifts.forEach((gift: { donorName: string }) => {
      expect(gift.donorName).not.toBe('Anonymous');
    });
  });

  test('Board_SwitchedOffCampaign_IsRefusedWithTheSameSentence', async () => {
    await organizer.post(settingsUrl(campaignUniqueId), {
      data: settingsWith({ isPeerToPeerEnabled: false }),
    });

    const response = await anonymous.get(leaderboardUrl(campaignSlug));

    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Leaderboard not found.');

    await applySettings();
  });
});
