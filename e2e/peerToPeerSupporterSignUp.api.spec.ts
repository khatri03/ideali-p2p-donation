import { APIRequestContext, expect, test } from '@playwright/test';
import { anonymousApi, authenticatedApi, settingsUrl, signIn, supporterSignUpUrl } from './support/apiSession';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';

/**
 * The only endpoint in this product a stranger can use to write to the user table, so what it refuses
 * matters more than what it accepts. The account it creates is deleted afterwards, keyed on the login
 * address this suite owns, so nothing is left behind on a shared database.
 *
 * Deliberately few requests: the endpoint is rate limited per address, and a spec that spent the whole
 * allowance would start failing on its own limiter rather than on the rule it was written to prove.
 */

const SIGN_UP_EMAIL = 'e2e-supporter-signup@example.test';
const SIGN_UP_PASSWORD = 'Fundrais3!';

let api: APIRequestContext;
let anonymous: APIRequestContext;
let campaignUniqueId: string;
let originalSettings: Record<string, unknown>;

const signUpBody = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'E2E',
  lastName: 'Supporter',
  emailAddress: SIGN_UP_EMAIL,
  password: SIGN_UP_PASSWORD,
  ...overrides,
});

const applySettings = async (overrides: Record<string, unknown> = {}) => {
  const response = await api.post(settingsUrl(campaignUniqueId), {
    data: {
      isPeerToPeerEnabled: true,
      defaultPersonalGoal: 250,
      allowTeams: false,
      requiresApproval: false,
      leaderboardVisibility: 'Public',
      ...overrides,
    },
  });

  expect(response.status()).toBe(200);
};

const removeSignedUpAccount = (): void =>
  execute(`
    DECLARE @contactId INT = (SELECT TOP 1 ContactId FROM [User] WHERE UserName = '${SIGN_UP_EMAIL}');
    DELETE FROM EmailVerificationRequest WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SIGN_UP_EMAIL}');
    DELETE FROM UserRole WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SIGN_UP_EMAIL}');
    DELETE FROM UserModule WHERE UserId IN (SELECT Id FROM [User] WHERE UserName = '${SIGN_UP_EMAIL}');
    DELETE FROM [User] WHERE UserName = '${SIGN_UP_EMAIL}';
    DELETE FROM ContactEmail WHERE ContactId = @contactId;
    DELETE FROM Contact WHERE Id = @contactId;
  `);

const accountCount = (): string =>
  querySingleValue(`
    SELECT CAST(COUNT(*) AS VARCHAR(10)) FROM [User] WHERE UserName = '${SIGN_UP_EMAIL}';
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();
  campaignUniqueId = liveCampaign().uniqueId;
  originalSettings = (await (await api.get(settingsUrl(campaignUniqueId))).json()).data;

  removeSignedUpAccount();
  await applySettings();
});

test.afterAll(async () => {
  removeSignedUpAccount();

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
});

test.describe('Supporter sign-up endpoint', () => {
  test('SignUp_AnonymousCallerOnALiveCampaign_CreatesASupporterNotAnOrganiser', async () => {
    const response = await anonymous.post(supporterSignUpUrl(campaignUniqueId), {
      data: signUpBody(),
    });

    expect(response.status()).toBe(200);
    expect(accountCount()).toBe('1');

    const roles = querySingleValue(`
      SELECT STRING_AGG(role.Name, ',')
      FROM UserRole userRole
      INNER JOIN [User] account ON account.Id = userRole.UserId
      INNER JOIN Role role ON role.Id = userRole.RoleId
      WHERE account.UserName = '${SIGN_UP_EMAIL}';
    `);

    expect(roles).toBe('Participant');

    const organizerMatchesTheCampaign = querySingleValue(`
      SELECT CASE WHEN contact.OrganizerId = campaign.OrganizerId THEN 'yes' ELSE 'no' END
      FROM [User] account
      INNER JOIN Contact contact ON contact.Id = account.ContactId
      CROSS JOIN DonationCampaign campaign
      WHERE account.UserName = '${SIGN_UP_EMAIL}' AND campaign.UniqueId = '${campaignUniqueId}';
    `);

    expect(organizerMatchesTheCampaign).toBe('yes');
  });

  test('SignUp_AddressAlreadyRegistered_AnswersAsItAnswersASuccessAndCreatesNoSecondAccount', async () => {
    const response = await anonymous.post(supporterSignUpUrl(campaignUniqueId), {
      data: signUpBody({ password: 'Different1!' }),
    });

    expect(response.status()).toBe(200);
    expect(accountCount()).toBe('1');

    const body = await response.json();
    expect(body.message).toContain('Check your inbox');
  });

  test('SignUp_UnknownCampaign_IsRefusedWithoutRevealingWhetherItExists', async () => {
    const response = await anonymous.post(
      supporterSignUpUrl('00000000-0000-0000-0000-0000000000ff'),
      { data: signUpBody({ emailAddress: 'e2e-never-created@example.test' }) },
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Campaign not found.');
    expect(JSON.stringify(body).toLowerCase()).not.toContain('exception');
    expect(JSON.stringify(body).toLowerCase()).not.toContain('sql');
  });

  test('SignUp_PasswordBelowThePolicy_IsRefusedByTheServerNotOnlyByTheForm', async () => {
    const response = await anonymous.post(supporterSignUpUrl(campaignUniqueId), {
      data: signUpBody({ emailAddress: 'e2e-weak-password@example.test', password: 'weak' }),
    });

    expect(response.status()).toBe(400);

    const created = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(10)) FROM [User] WHERE UserName = 'e2e-weak-password@example.test';
    `);

    expect(created).toBe('0');
  });
});
