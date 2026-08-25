import { APIRequestContext, expect, test } from '@playwright/test';
import {
  anonymousApi,
  authenticatedApi,
  joinUrl,
  resendVerificationUrl,
  settingsUrl,
  signIn,
  supporterSignUpUrl,
  verifyEmailUrl,
} from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * Confirming a supporter's address, proven from the outside.
 *
 * The token itself never leaves the server in a form this suite can read - only its digest is stored,
 * which is the property the first test here relies on. Where a live token is needed, one is planted
 * directly in the table with a digest this file computed, so the endpoint is exercised for real
 * without anyone having to read an inbox.
 */

const SUPPORTER_EMAIL = 'e2e-verify-supporter@example.test';
const SUPPORTER_PASSWORD = 'Fundrais3!';
const LIVE_TOKEN = 'e2e-live-token-value';
const OTHER_CAMPAIGN_TOKEN = 'e2e-other-campaign-token';

let api: APIRequestContext;
let anonymous: APIRequestContext;
// One sign-in for the supporter, reused either side of confirmation. The claims in the token say
// nothing about a confirmed address - the gate reads the row - so a second sign-in would only spend
// another of the five attempts a minute the endpoint allows.
let supporterApi: APIRequestContext;
let campaignUniqueId: string;
let originalSettings: Record<string, unknown>;

const removeSupporter = (): void =>
  execute(`
    DECLARE @contactId INT = (SELECT TOP 1 ContactId FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}');
    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE FROM CampaignFundraiser WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}');
    -- The supporter signs in during this spec, and a session leaves a refresh token behind.
    DELETE FROM RefreshToken WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}');
    DELETE FROM UserLoginHistory WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}');
    DELETE FROM EmailVerificationRequest WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}');
    DELETE FROM UserRole WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}');
    DELETE FROM UserModule WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}');
    DELETE FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}';
    DELETE FROM ContactEmail WHERE ContactId = @contactId;
    DELETE FROM Contact WHERE Id = @contactId;
  `);

/**
 * Plants a live token for the supporter. The digest is computed the way the service computes it -
 * lowercase hex of the SHA-256 of the token - so a change to either side fails this test.
 */
const plantToken = (token: string, forCampaignUniqueId: string): void =>
  execute(`
    INSERT INTO EmailVerificationRequest (UniqueId, UserId, CampaignUniqueId, TokenHash, ExpiresOnUtc, IsUsed, CreatedOnUtc)
    SELECT NEWID(),
           account.Id,
           '${forCampaignUniqueId}',
           LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '${token}'), 2)),
           DATEADD(MINUTE, 60, GETUTCDATE()),
           0,
           GETUTCDATE()
    FROM [User] account
    WHERE account.UserName = '${SUPPORTER_EMAIL}';
  `);

const isEmailConfirmed = (): string =>
  querySingleValue(`
    SELECT CAST(EmailConfirmed AS VARCHAR(1)) FROM [User] WHERE UserName = '${SUPPORTER_EMAIL}';
  `);

const storedTokenHashes = (): string =>
  querySingleValue(`
    SELECT ISNULL(STRING_AGG(request.TokenHash, ','), '')
    FROM EmailVerificationRequest request
    INNER JOIN [User] account ON account.Id = request.UserId
    WHERE account.UserName = '${SUPPORTER_EMAIL}';
  `);

const spentTokenCount = (): string =>
  querySingleValue(`
    SELECT CAST(COUNT(*) AS VARCHAR(10))
    FROM EmailVerificationRequest request
    INNER JOIN [User] account ON account.Id = request.UserId
    WHERE account.UserName = '${SUPPORTER_EMAIL}' AND request.IsUsed = 1;
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();
  campaignUniqueId = liveCampaign().uniqueId;
  originalSettings = (await (await api.get(settingsUrl(campaignUniqueId))).json()).data;

  removeSupporter();

  const applied = await api.post(settingsUrl(campaignUniqueId), {
    data: {
      isPeerToPeerEnabled: true,
      defaultPersonalGoal: 250,
      allowTeams: false,
      requiresApproval: false,
      leaderboardVisibility: 'Public',
    },
  });

  expect(applied.status()).toBe(200);

  const signedUp = await anonymous.post(supporterSignUpUrl(campaignUniqueId), {
    data: {
      firstName: 'E2E',
      lastName: 'Supporter',
      emailAddress: SUPPORTER_EMAIL,
      password: SUPPORTER_PASSWORD,
    },
  });

  expect(signedUp.status()).toBe(200);

  supporterApi = await authenticatedApi(await signIn(SUPPORTER_EMAIL, SUPPORTER_PASSWORD));
});

test.afterAll(async () => {
  removeSupporter();

  if (originalSettings) {
    await api.post(settingsUrl(campaignUniqueId), {
      data: {
        isPeerToPeerEnabled: originalSettings.isPeerToPeerEnabled,
        defaultPersonalGoal: originalSettings.defaultPersonalGoal,
        allowTeams: originalSettings.allowTeams,
        requiresApproval: originalSettings.requiresApproval,
        leaderboardVisibility: originalSettings.leaderboardVisibility,
      },
    });
  }

  await api.dispose();
  await anonymous.dispose();
  await supporterApi?.dispose();
});

test.describe('Supporter email verification', () => {
  /**
   * A leaked backup must not hand anybody a link they can follow. What is kept is a digest, and a
   * digest is not something that can be put in a URL.
   */
  test('SignUp_Completed_LeavesADigestBehindAndNeverTheTokenItself', async () => {
    const hashes = storedTokenHashes();

    expect(hashes).not.toBe('');
    expect(hashes).toMatch(/^[0-9a-f]{64}$/);
    expect(isEmailConfirmed()).toBe('0');
  });

  /**
   * The gate that gives verification its meaning. An account whose address is unproven can sign in,
   * but cannot put a charity's name on a fundraising page.
   */
  test('Join_SupporterWhoHasNotConfirmedTheirAddress_IsRefusedAndCreatesNoPage', async () => {
    const response = await supporterApi.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'E2E Supporter', personalGoal: 100 },
    });

    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.message).toContain('Confirm your email address');

    const created = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(10))
      FROM CampaignFundraiser fundraiser
      INNER JOIN [User] account ON account.Id = fundraiser.UserId
      WHERE account.UserName = '${SUPPORTER_EMAIL}';
    `);

    expect(created).toBe('0');
  });

  test('Verify_TokenThatWasNeverIssued_IsRefusedWithoutRevealingAnything', async () => {
    const response = await anonymous.post(verifyEmailUrl(campaignUniqueId), {
      data: { token: 'not-a-real-token' },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(JSON.stringify(body).toLowerCase()).not.toContain('exception');
    expect(JSON.stringify(body).toLowerCase()).not.toContain('sql');
    expect(isEmailConfirmed()).toBe('0');
  });

  /**
   * A token belongs to the campaign it was issued for. Replaying it against another campaign in the
   * address bar must confirm nothing.
   */
  test('Verify_TokenIssuedForAnotherCampaign_ConfirmsNothing', async () => {
    plantToken(OTHER_CAMPAIGN_TOKEN, '00000000-0000-0000-0000-0000000000ff');

    const response = await anonymous.post(verifyEmailUrl(campaignUniqueId), {
      data: { token: OTHER_CAMPAIGN_TOKEN },
    });

    expect(response.status()).toBe(400);
    expect(isEmailConfirmed()).toBe('0');
  });

  test('Verify_LiveToken_ConfirmsTheAddressAndSpendsTheToken', async () => {
    plantToken(LIVE_TOKEN, campaignUniqueId);

    const response = await anonymous.post(verifyEmailUrl(campaignUniqueId), {
      data: { token: LIVE_TOKEN },
    });

    expect(response.status()).toBe(200);
    expect(isEmailConfirmed()).toBe('1');
    expect(Number(spentTokenCount())).toBeGreaterThanOrEqual(1);
  });

  test('Verify_SameLinkFollowedAgain_IsRefusedTheSecondTime', async () => {
    const response = await anonymous.post(verifyEmailUrl(campaignUniqueId), {
      data: { token: LIVE_TOKEN },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * Confirmed, so the gate lets go. Proving the refusal without also proving the release would leave
   * a supporter who did everything asked of them stuck.
   */
  test('Join_SupporterWhoConfirmedTheirAddress_IsAllowedToCreateTheirPage', async () => {
    const response = await supporterApi.post(joinUrl(campaignUniqueId), {
      data: { displayName: 'E2E Supporter', personalGoal: 100 },
    });

    const body = await response.json();

    expect(body.success).toBe(true);
  });

  test('Resend_AddressNobodyHere_AnswersExactlyAsARealResendDoes', async () => {
    const unknown = await anonymous.post(resendVerificationUrl(campaignUniqueId), {
      data: { emailAddress: 'e2e-nobody-at-all@example.test' },
    });

    expect(unknown.status()).toBe(200);

    const body = await unknown.json();
    expect(body.message).toContain('If that address needs confirming');
  });

  test('Resend_UnknownCampaign_IsRefusedWithoutRevealingWhetherItExists', async () => {
    const response = await anonymous.post(
      resendVerificationUrl('00000000-0000-0000-0000-0000000000ff'),
      { data: { emailAddress: SUPPORTER_EMAIL } },
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Campaign not found.');
  });
});
