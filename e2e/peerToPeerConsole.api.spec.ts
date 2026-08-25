import { APIRequestContext, expect, test } from '@playwright/test';
import { anonymousApi, authenticatedApi, signIn } from './support/apiSession';
import { e2eEnv } from './support/e2eEnv';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * The console endpoints are the first in this feature that both read and write private data, so what
 * they refuse matters as much as what they return. Ownership is proven from the outside: no token,
 * and another supporter's page, must each be refused, and the refusal must not reveal whether the page
 * exists.
 *
 * Every row written here is tagged and removed afterwards.
 */

const campaign = liveCampaign();
const PROBE_TAG = 'e2e-console';
const OWN_SLUG = 'e2e-console-mine';
const OTHER_SLUG = 'e2e-console-theirs';

const CONSOLE_URL = '/api/member/my-fundraising';

/** A real one-pixel PNG, so the upload proves the whole path rather than the content-type check alone. */
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

let api: APIRequestContext;
let anonymous: APIRequestContext;
let ownPageUniqueId: string;
let otherPageUniqueId: string;

const pageUrl = (uniqueId: string) => `${CONSOLE_URL}/${uniqueId}`;

const removeProbePages = (): void =>
  execute(`
    ${PROBE_LIFECYCLE_TRAIL_SQL}
    DELETE FROM CampaignFundraiser WHERE CreatedBy = '${PROBE_TAG}';
  `);

/**
 * The signed-in account's own user row. Read by user name rather than hardcoded, because a user
 * identifier is environment data and a test that carries one is a test that only runs on one machine.
 */
const signedInUserId = (): string =>
  querySingleValue(`
    SELECT CAST(TOP_USER.Id AS VARCHAR(20)) FROM (
      SELECT TOP 1 Id FROM [User] WHERE UserName = '${e2eEnv.organizerUsername}' ORDER BY Id
    ) AS TOP_USER;
  `);

const insertPage = (slug: string, userId: string, displayName: string): string => {
  execute(`
    DECLARE @campaignId INT = (SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}');
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);

    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, @organizerId, @campaignId, ${userId}, '${slug}', '${displayName}',
       'Written by the e2e suite.', 500, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

  return querySingleValue(`
    SELECT LOWER(CAST(UniqueId AS VARCHAR(50))) FROM CampaignFundraiser WHERE Slug = '${slug}';
  `);
};

/** Any account other than the signed-in one, so "not mine" is a real row rather than a missing one. */
const someoneElsesUserId = (ownUserId: string): string =>
  querySingleValue(`
    SELECT CAST(TOP_USER.Id AS VARCHAR(20)) FROM (
      SELECT TOP 1 Id FROM [User] WHERE Id <> ${ownUserId} ORDER BY Id
    ) AS TOP_USER;
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();

  execute(`
    UPDATE DonationCampaign
    SET IsPeerToPeerEnabled = 1,
        PeerToPeerSlug = ISNULL(PeerToPeerSlug, 'e2e-campaign-' + CAST(Id AS VARCHAR(10)))
    WHERE UniqueId = '${campaign.uniqueId}';
  `);

  removeProbePages();

  const ownUserId = signedInUserId();

  ownPageUniqueId = insertPage(OWN_SLUG, ownUserId, 'E2E Console Mine');
  otherPageUniqueId = insertPage(OTHER_SLUG, someoneElsesUserId(ownUserId), 'E2E Console Theirs');
});

test.afterAll(async () => {
  removeProbePages();
  await api.dispose();
  await anonymous.dispose();
});

test.describe('Fundraiser console endpoints', () => {
  test('Console_NoToken_IsRefusedBeforeAnythingIsRead', async () => {
    const response = await anonymous.get(CONSOLE_URL);

    expect([401, 403]).toContain(response.status());
  });

  test('Console_SignedInSupporter_SeesTheirOwnPageAndNotSomebodyElses', async () => {
    const body = await (await api.get(CONSOLE_URL)).json();
    const slugs = body.data.map((page: { slug: string }) => page.slug);

    expect(slugs).toContain(OWN_SLUG);
    expect(slugs).not.toContain(OTHER_SLUG);
  });

  test('Console_Response_CarriesNoEmailAddressAndNoUserIdentifier', async () => {
    const raw = await (await api.get(CONSOLE_URL)).text();

    expect(raw.toLowerCase()).not.toContain('userid');
    expect(raw).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  test('Console_AnotherSupportersPage_IsRefusedWithoutRevealingWhetherItExists', async () => {
    const theirs = await api.get(pageUrl(otherPageUniqueId));
    const nonexistent = await api.get(pageUrl('11111111-1111-1111-1111-111111111111'));

    expect(theirs.ok()).toBe(false);
    expect((await theirs.json()).message).toBe('Fundraising page not found.');
    expect((await nonexistent.json()).message).toBe((await theirs.json()).message);
  });

  test('Console_NoToken_CannotReadASinglePageEither', async () => {
    const response = await anonymous.get(pageUrl(ownPageUniqueId));

    expect([401, 403]).toContain(response.status());
  });

  test('Update_OwnPage_IsPersistedAndReadBackFromTheDatabase', async () => {
    const response = await api.put(pageUrl(ownPageUniqueId), {
      data: { displayName: 'E2E Console Renamed', personalGoal: 1234, story: 'Edited by the suite.' },
    });

    expect(response.status()).toBe(200);

    const saved = querySingleValue(`
      SELECT DisplayName + '|' + CAST(PersonalGoal AS VARCHAR(20))
      FROM CampaignFundraiser WHERE Slug = '${OWN_SLUG}';
    `);

    expect(saved).toBe('E2E Console Renamed|1234.00');
  });

  test('Update_GoalCleared_IsStillClearWhenTheConsoleIsReadBack', async () => {
    await api.put(pageUrl(ownPageUniqueId), {
      data: { displayName: 'E2E Console Mine', personalGoal: 640, story: null },
    });

    const response = await api.put(pageUrl(ownPageUniqueId), {
      data: { displayName: 'E2E Console Mine', personalGoal: null, story: null },
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).data.goal).toBeNull();

    const stored = querySingleValue(`
      SELECT ISNULL(CAST(PersonalGoal AS VARCHAR(20)), 'NONE')
      FROM CampaignFundraiser WHERE Slug = '${OWN_SLUG}';
    `);

    expect(stored).toBe('NONE');

    const reread = await (await api.get(CONSOLE_URL)).json();
    const page = reread.data.find((item: { slug: string }) => item.slug === OWN_SLUG);

    expect(page.goal).toBeNull();
  });

  test('Update_PageAddress_IsNotSomethingAnUpdateCanChange', async () => {
    await api.put(pageUrl(ownPageUniqueId), {
      data: { displayName: 'Another name entirely', personalGoal: 300, story: null, slug: 'stolen' },
    });

    const slug = querySingleValue(`
      SELECT Slug FROM CampaignFundraiser WHERE UniqueId = '${ownPageUniqueId}';
    `);

    expect(slug).toBe(OWN_SLUG);
  });

  test('Update_AnotherSupportersPage_IsRefusedAndLeavesTheirPageUnchanged', async () => {
    const response = await api.put(pageUrl(otherPageUniqueId), {
      data: { displayName: 'Taken over', personalGoal: 10, story: null },
    });

    expect(response.ok()).toBe(false);

    const unchanged = querySingleValue(`
      SELECT DisplayName FROM CampaignFundraiser WHERE Slug = '${OTHER_SLUG}';
    `);

    expect(unchanged).toBe('E2E Console Theirs');
  });

  test('Update_GoalOfZero_IsRefusedByTheServerRatherThanOnlyByTheScreen', async () => {
    const response = await api.put(pageUrl(ownPageUniqueId), {
      data: { displayName: 'E2E Console Mine', personalGoal: 0, story: null },
    });

    expect(response.ok()).toBe(false);
    expect((await response.json()).message).toBe(
      'Enter a goal greater than zero, or leave it blank.',
    );
  });

  test('Update_AbsurdlyLargeGoal_IsRefusedByTheServer', async () => {
    const response = await api.put(pageUrl(ownPageUniqueId), {
      data: { displayName: 'E2E Console Mine', personalGoal: 99_000_000, story: null },
    });

    expect(response.ok()).toBe(false);
  });

  test('Update_EmptyName_IsRefusedByTheServer', async () => {
    const response = await api.put(pageUrl(ownPageUniqueId), {
      data: { displayName: '   ', personalGoal: 500, story: null },
    });

    expect(response.ok()).toBe(false);
    expect((await response.json()).message).toBe(
      'Enter the name to show on your fundraising page.',
    );
  });

  test('Photo_NoToken_CannotBeAttachedToAnybodysPage', async () => {
    const response = await anonymous.post(`${pageUrl(ownPageUniqueId)}/photo`, {
      multipart: {
        photo: { name: 'portrait.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('binary') },
      },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('Photo_AnotherSupportersPage_IsRefused', async () => {
    const response = await api.post(`${pageUrl(otherPageUniqueId)}/photo`, {
      multipart: {
        photo: { name: 'portrait.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('binary') },
      },
    });

    expect(response.ok()).toBe(false);
  });

  test('Photo_FileOfTheWrongType_IsRefusedByTheServer', async () => {
    const response = await api.post(`${pageUrl(ownPageUniqueId)}/photo`, {
      multipart: {
        photo: { name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('binary') },
      },
    });

    expect(response.ok()).toBe(false);
  });

  test('Photo_AcceptedImage_IsStoredAndReadBackAgainstThatPageFromTheDatabase', async () => {
    const response = await api.post(`${pageUrl(ownPageUniqueId)}/photo`, {
      multipart: {
        photo: { name: 'portrait.png', mimeType: 'image/png', buffer: ONE_PIXEL_PNG },
      },
    });

    expect(response.status()).toBe(200);

    const storedUniqueId = querySingleValue(`
      SELECT LOWER(CAST(stored.UniqueId AS VARCHAR(50)))
      FROM CampaignFundraiser fundraiser
      INNER JOIN FileStorage stored ON stored.Id = fundraiser.PhotoFileStorageId
      WHERE fundraiser.Slug = '${OWN_SLUG}';
    `);

    expect(storedUniqueId).toBe(String((await response.json()).data).toLowerCase());
  });

  test('Photo_Removed_LeavesThePageWithNoPhotoInTheDatabase', async () => {
    await api.post(`${pageUrl(ownPageUniqueId)}/photo`, {
      multipart: {
        photo: { name: 'portrait.png', mimeType: 'image/png', buffer: ONE_PIXEL_PNG },
      },
    });

    expect((await api.delete(`${pageUrl(ownPageUniqueId)}/photo`)).status()).toBe(200);

    const remaining = querySingleValue(`
      SELECT ISNULL(CAST(PhotoFileStorageId AS VARCHAR(10)), 'NONE')
      FROM CampaignFundraiser WHERE Slug = '${OWN_SLUG}';
    `);

    expect(remaining).toBe('NONE');
  });

  test('Photo_RemovalOnAnotherSupportersPage_IsRefused', async () => {
    const response = await api.delete(`${pageUrl(otherPageUniqueId)}/photo`);

    expect(response.ok()).toBe(false);
  });

  test('Console_ErrorResponse_CarriesNoStackTraceAndNoFrameworkDetail', async () => {
    const raw = await (await api.get(pageUrl('11111111-1111-1111-1111-111111111111'))).text();

    expect(raw).not.toContain('Ideas.');
    expect(raw).not.toContain('   at ');
    expect(raw).not.toContain('Microsoft.');
  });
});
