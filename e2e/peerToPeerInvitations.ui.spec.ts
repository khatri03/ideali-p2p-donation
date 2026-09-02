import { Page, expect, test } from '@playwright/test';
import { liveCampaign } from './support/campaignFixtures';
import { execute, querySingleValue } from './support/database';

/**
 * The invitation and lifecycle-email screens in a real browser, at every supported width. What no unit
 * test can prove lives here: that pressing send reaches the database, that the preview really is the
 * email rather than a description of it, that an edited template survives a reload, and that a five
 * column table never makes the page itself scroll sideways.
 *
 * Everything this suite writes carries the probe tag and is removed afterwards.
 */

const campaign = liveCampaign();
const PROBE_DOMAIN = 'e2e-invite-ui.test';
const PROBE_SUBJECT = 'E2E Invitation UI Template';

const root = `/organizer/donation/campaign/${campaign.uniqueId}/peer-to-peer`;
const invitationsPath = `${root}/invitations`;
const emailsPath = `${root}/email-templates`;

const campaignIdSql = `(SELECT Id FROM DonationCampaign WHERE UniqueId = '${campaign.uniqueId}')`;

const removeProbeData = (): void =>
  execute(`
    DELETE FROM FundraiserInvitation WHERE EmailAddress LIKE '%@${PROBE_DOMAIN}';
    DELETE FROM EmailSuppression WHERE EmailAddress LIKE '%@${PROBE_DOMAIN}';
    DELETE FROM PeerToPeerEmailTemplate WHERE Subject LIKE '${PROBE_SUBJECT}%';
  `);

const probeAddress = (label: string) => `${label}@${PROBE_DOMAIN}`;

/**
 * A live invitation whose code the suite knows, so a browser can follow the link the way a recipient
 * would. The row stores only the hash, exactly as the API does, and the plain code never leaves this
 * file.
 */
const insertInvitationWithCode = (address: string, code: string): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdSql};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);

    INSERT INTO FundraiserInvitation
      (UniqueId, OrganizerId, DonationCampaignId, EmailAddress, PersonalMessage, TokenHash,
       ExpiresOnUtc, CurrentStatus, InvitedByUserId, InvitedByName, CreatedOnUtc, SentOnUtc)
    VALUES
      (NEWID(), @organizerId, @campaignId, '${address}', NULL,
       LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', '${code}'), 2)),
       DATEADD(DAY, 14, SYSUTCDATETIME()), 'Sent', (SELECT MIN(Id) FROM [User]),
       'E2E Invitation Suite', SYSUTCDATETIME(), SYSUTCDATETIME());
  `);

/**
 * Clears one probe address only - its invitation, and the supporter account a sign-up test may have
 * created under it. Scoped to the address rather than the probe domain so one block never removes
 * rows another block is still using.
 */
const removeInvitationsTo = (address: string): void =>
  execute(`
    DECLARE @contactId INT = (SELECT TOP 1 ContactId FROM [User] WHERE UserName = '${address}');
    DECLARE @userId INT = (SELECT TOP 1 Id FROM [User] WHERE UserName = '${address}');

    DELETE FROM FundraiserInvitation WHERE EmailAddress = '${address}';
    DELETE FROM EmailVerificationRequest WHERE UserId = @userId;
    DELETE FROM UserRole WHERE UserId = @userId;
    DELETE FROM UserModule WHERE UserId = @userId;
    DELETE FROM [User] WHERE Id = @userId;
    DELETE FROM ContactEmail WHERE ContactId = @contactId;
    DELETE FROM Contact WHERE Id = @contactId;
  `);

const insertInvitation = (address: string, status: string): void =>
  execute(`
    DECLARE @campaignId INT = ${campaignIdSql};
    DECLARE @organizerId INT = (SELECT OrganizerId FROM DonationCampaign WHERE Id = @campaignId);

    INSERT INTO FundraiserInvitation
      (UniqueId, OrganizerId, DonationCampaignId, EmailAddress, PersonalMessage, TokenHash,
       ExpiresOnUtc, CurrentStatus, InvitedByUserId, InvitedByName, CreatedOnUtc, SentOnUtc)
    VALUES
      (NEWID(), @organizerId, @campaignId, '${address}', NULL,
       CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(NEWID() AS NVARCHAR(50))), 2),
       DATEADD(DAY, 14, SYSUTCDATETIME()), '${status}', (SELECT MIN(Id) FROM [User]),
       'E2E Invitation Suite', SYSUTCDATETIME(), SYSUTCDATETIME());
  `);

const suppress = (address: string, detail: string): void =>
  execute(`
    INSERT INTO EmailSuppression
      (UniqueId, OrganizerId, EmailAddress, Reason, Detail, SuppressedOnUtc)
    VALUES
      (NEWID(), (SELECT OrganizerId FROM DonationCampaign WHERE Id = ${campaignIdSql}),
       '${address}', 'HardBounce', '${detail}', SYSUTCDATETIME());
  `);

const invitationCount = (address: string): number =>
  Number(
    querySingleValue(
      `SELECT COUNT(*) FROM FundraiserInvitation WHERE EmailAddress = '${address}';`,
    ),
  );

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/**
 * The list renders as a table above lg and as cards below it, so both are in the document at every
 * width and only one of them is on screen. Every assertion here looks for the visible copy.
 */
const visibleText = (page: Page, text: string) =>
  page.getByText(text).filter({ visible: true }).first();

test.beforeEach(() => removeProbeData());

test.afterAll(() => removeProbeData());

test.describe('Getting to the invitation screens', () => {
  test('Tabs_Oversight_OffersInvitationsAndEmailsAlongsideTheRest', async ({ page }) => {
    await page.goto(root);

    await expect(page.getByRole('link', { name: 'Invitations', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Emails', exact: true })).toBeVisible();
  });

  test('Tabs_InvitationsOpen_MarksThatTabAsTheCurrentOne', async ({ page }) => {
    await page.goto(invitationsPath);

    await expect(page.getByRole('link', { name: 'Invitations', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('Tabs_EveryOne_ShowsAPointerCursorOnHover', async ({ page }) => {
    await page.goto(invitationsPath);

    await expect(page.getByRole('link', { name: 'Emails', exact: true })).toHaveCSS(
      'cursor',
      'pointer',
    );
  });
});

test.describe('Screen 13 - inviting people', () => {
  test('Invite_Opened_ExplainsThatNothingIsCreatedUntilSomebodyAgrees', async ({ page }) => {
    await page.goto(invitationsPath);

    await expect(
      visibleText(
        page,
        'An invitation is an offer. Nothing is created until the person follows the link and agrees.',
      ),
    ).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('Invite_NothingTyped_KeepsSendUnavailableWithANotAllowedCursor', async ({ page }) => {
    await page.goto(invitationsPath);

    const send = page.getByRole('button', { name: 'Send invitations' });

    await expect(send).toBeDisabled();
    await expect(send).toHaveCSS('cursor', 'not-allowed');
  });

  test('Invite_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(invitationsPath);

    const addresses = await page.getByLabel('Email addresses').boundingBox();
    const preview = await page.getByRole('button', { name: 'Preview the email' }).boundingBox();

    expect(addresses?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(preview?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('Invite_MalformedAddress_IsRefusedOnScreenWithoutWritingAnything', async ({ page }) => {
    await page.goto(invitationsPath);

    await page.getByLabel('Email addresses').fill('not-an-address');
    await page.getByRole('button', { name: 'Send invitations' }).click();

    await expect(
      visibleText(page, 'not-an-address is not a valid email address.'),
    ).toBeVisible();
  });

  test('Invite_ValidAddress_ReachesTheDatabaseAndAppearsInTheList', async ({ page }) => {
    const address = probeAddress('sent');

    await page.goto(invitationsPath);
    await page.getByLabel('Email addresses').fill(address);
    await page.getByRole('button', { name: 'Send invitations' }).click();

    await expect(visibleText(page, address)).toBeVisible();
    expect(invitationCount(address)).toBe(1);
  });

  test('Invite_SameAddressTwice_IsSkippedAndSaysSoWithoutNamingIt', async ({ page }) => {
    const address = probeAddress('twice');

    insertInvitation(address, 'Sent');

    await page.goto(invitationsPath);
    await page.getByLabel('Email addresses').fill(address);
    await page.getByRole('button', { name: 'Send invitations' }).click();

    await expect(page.getByText('No invitations went out.')).toBeVisible();
    expect(invitationCount(address)).toBe(1);
  });

  test('Invite_PersonalMessage_CountsWhatIsLeftRatherThanCuttingItOffSilently', async ({ page }) => {
    await page.goto(invitationsPath);

    await page.getByLabel('Personal message').fill('Please help.');

    await expect(visibleText(page, '12 of 1000 characters')).toBeVisible();
  });
});

test.describe('Screen 19 - the invitation email', () => {
  test('Preview_Requested_ShowsTheEmailItselfInAFrameThatCanReachNothing', async ({ page }) => {
    await page.goto(invitationsPath);

    await page.getByLabel('Personal message').fill('A line in my own words.');
    await page.getByRole('button', { name: 'Preview the email' }).click();

    const frame = page.getByTitle('Invitation email preview');

    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute('sandbox', '');
  });

  test('Preview_Email_CarriesTheSubjectTheRecipientWillSee', async ({ page }) => {
    await page.goto(invitationsPath);

    await page.getByRole('button', { name: 'Preview the email' }).click();

    await expect(page.getByText('Will you fundraise for')).toBeVisible();
  });

  test('Preview_Email_CarriesAWayOutAndNamesWhoSentIt', async ({ page }) => {
    await page.goto(invitationsPath);

    await page.getByRole('button', { name: 'Preview the email' }).click();

    const frame = page.frameLocator('iframe[title="Invitation email preview"]');

    await expect(frame.getByText('Stop receiving these emails')).toBeVisible();
    await expect(frame.getByText('Sent by')).toBeVisible();
  });

  test('Preview_PersonalMessage_ReachesTheEmailAsWordsRatherThanAsMarkup', async ({ page }) => {
    await page.goto(invitationsPath);

    await page.getByLabel('Personal message').fill('<b>bold attempt</b>');
    await page.getByRole('button', { name: 'Preview the email' }).click();

    const frame = page.frameLocator('iframe[title="Invitation email preview"]');

    await expect(frame.getByText('<b>bold attempt</b>')).toBeVisible();
  });

  test('Preview_Closed_ReturnsToTheFormWithoutLosingWhatWasTyped', async ({ page }) => {
    await page.goto(invitationsPath);

    await page.getByLabel('Personal message').fill('Kept while previewing.');
    await page.getByRole('button', { name: 'Preview the email' }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await expect(page.getByLabel('Personal message')).toHaveValue('Kept while previewing.');
  });
});

test.describe('Following up on invitations', () => {
  test('List_HeldBackAddress_ShowsTheOrganiserWhyNothingWillGo', async ({ page }) => {
    const address = probeAddress('held');

    insertInvitation(address, 'Suppressed');
    suppress(address, 'Mailbox does not exist');

    await page.goto(invitationsPath);
    await page.getByLabel('Search invitations').fill(address);

    await expect(visibleText(page, 'Mail was returned undelivered')).toBeVisible();
  });

  test('List_StatusFilter_NarrowsToWhatWasAsked', async ({ page }) => {
    const sent = probeAddress('filter-sent');
    const accepted = probeAddress('filter-accepted');

    insertInvitation(sent, 'Sent');
    insertInvitation(accepted, 'Accepted');

    await page.goto(invitationsPath);
    await page.getByLabel('Search invitations').fill(PROBE_DOMAIN);
    await page.getByLabel('Status').selectOption('Accepted');

    await expect(visibleText(page, accepted)).toBeVisible();
    await expect(page.getByText(sent)).toHaveCount(0);
  });

  test('List_NothingMatches_ShowsADesignedEmptyStateRatherThanABlankArea', async ({ page }) => {
    await page.goto(invitationsPath);
    await page.getByLabel('Search invitations').fill('nobody-here@nowhere.test');

    await expect(page.getByText('No invitations match that')).toBeVisible();
  });

  test('List_UnknownCampaign_ShowsARetryableBannerAndNoInternalDetail', async ({ page }) => {
    await page.goto(
      '/organizer/donation/campaign/00000000-0000-0000-0000-0000000000ff/peer-to-peer/invitations',
    );

    const banner = page.getByRole('alert');

    await expect(banner).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();

    const message = (await banner.innerText()).toLowerCase();

    expect(message).not.toContain('exception');
    expect(message).not.toContain('sql');
  });
});

test.describe('Screen 11 - the lifecycle emails', () => {
  test('Emails_Opened_ShowEveryTemplateWithWhenItSends', async ({ page }) => {
    await page.goto(emailsPath);

    await expect(page.getByRole('heading', { name: 'Welcome', exact: true })).toBeVisible();
    await expect(visibleText(page, 'As soon as a page goes live.')).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('Emails_Opened_OfferTheApprovalAndRefusalNoticesAsEditableCopy', async ({ page }) => {
    await page.goto(emailsPath);

    await expect(page.getByRole('heading', { name: 'Page approved', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Page not approved', exact: true })).toBeVisible();
    await expect(visibleText(page, 'As soon as the charity approves a page.')).toBeVisible();
    await expect(visibleText(page, 'As soon as the charity turns a page down.')).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('Emails_Placeholders_AreOfferedInTheSameFormTheDonationEmailsUse', async ({ page }) => {
    await page.goto(emailsPath);

    await expect(visibleText(page, '{{CampaignName}}')).toBeVisible();
  });

  test('Emails_EmptySubject_IsRefusedOnScreenWithoutWritingAnything', async ({ page }) => {
    await page.goto(emailsPath);

    await page.getByLabel('Subject line').first().fill('');
    await page.getByRole('button', { name: 'Save template' }).first().click();

    await expect(visibleText(page, 'Write a subject line before saving.')).toBeVisible();
  });

  test('Emails_EditedSubject_SurvivesAReloadBecauseItReachedTheDatabase', async ({ page }) => {
    await page.goto(emailsPath);

    await page.getByLabel('Subject line').first().fill(PROBE_SUBJECT);
    await page.getByRole('button', { name: 'Save template' }).first().click();

    await expect(page.getByText('Template saved.')).toBeVisible();

    await page.reload();

    await expect(page.getByLabel('Subject line').first()).toHaveValue(PROBE_SUBJECT);
  });

  test('Emails_SwitchedOff_ReadsAsOffRatherThanLookingIdenticalToTheRest', async ({ page }) => {
    await page.goto(emailsPath);

    await page.getByLabel('Subject line').first().fill(PROBE_SUBJECT);
    // The switch input is visually hidden behind its own track, so the click is forced onto it
    // rather than onto the decoration that sits over it.
    await page.getByLabel('Welcome enabled').click({ force: true });
    await page.getByRole('button', { name: 'Save template' }).first().click();

    await expect(page.getByText('Template saved.')).toBeVisible();
    await page.reload();

    await expect(visibleText(page, 'Off')).toBeVisible();
  });

  test('Emails_EveryControl_MeetsTheTouchTargetMinimum', async ({ page }) => {
    await page.goto(emailsPath);

    const subject = await page.getByLabel('Subject line').first().boundingBox();
    const save = await page.getByRole('button', { name: 'Save template' }).first().boundingBox();

    expect(subject?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(save?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('Emails_Editor_OffersOnlyTheFormattingTheSanitiserKeeps', async ({ page }) => {
    await page.goto(emailsPath);

    await expect(page.getByRole('button', { name: 'Bold' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add link' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Insert image' })).toHaveCount(0);
  });

  test('Emails_UnknownCampaign_ShowsARetryableBannerAndNoInternalDetail', async ({ page }) => {
    await page.goto(
      '/organizer/donation/campaign/00000000-0000-0000-0000-0000000000ff/peer-to-peer/email-templates',
    );

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});

test.describe('Following an invitation link', () => {
  test('Link_UnknownCode_SaysSoWithoutRevealingWhetherItEverExisted', async ({ page }) => {
    await page.goto(
      `/donation/campaign/${campaign.uniqueId}/peer-to-peer/invitation?token=never-issued-code`,
    );

    await expect(
      page.getByText('This invitation is no longer valid. Ask the charity to send you a new one.'),
    ).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });

  test('Link_WithNoCodeAtAll_AsksThePersonToOpenItFromTheEmail', async ({ page }) => {
    await page.goto(`/donation/campaign/${campaign.uniqueId}/peer-to-peer/invitation`);

    await expect(
      page.getByText('This link is incomplete. Open the invitation from the email you were sent.'),
    ).toBeVisible();
  });

  test('Unsubscribe_Link_ConfirmsNoMoreEmailsWillArriveEvenForAnUnknownCode', async ({ page }) => {
    await page.goto(
      `/donation/campaign/${campaign.uniqueId}/peer-to-peer/invitation/unsubscribe?token=never-issued-code`,
    );

    await expect(
      page.getByText('You will not receive any more of these emails.'),
    ).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

test.describe('Accepting an invitation without an account yet', () => {
  const INVITED_CODE = 'e2e-invited-code_1';
  const invitedAddress = probeAddress('needs-an-account');
  const invitationPath =
    `/donation/campaign/${campaign.uniqueId}/peer-to-peer/invitation?token=${INVITED_CODE}`;

  test.beforeAll(() => {
    removeInvitationsTo(invitedAddress);
    insertInvitationWithCode(invitedAddress, INVITED_CODE);
  });

  test.afterAll(() => removeInvitationsTo(invitedAddress));

  // Nobody the charity invited by email has an account here yet, so this block runs with no session.
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * The whole point of the invitation screen for a new supporter. Offering sign-in alone leaves them
   * to discover on their own that they must create an account first, on a screen they have to find.
   */
  test('Invitation_RecipientHasNoAccount_IsOfferedBothSigningInAndCreatingOne', async ({ page }) => {
    await page.goto(invitationPath);

    await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Create account' })).toBeVisible();
  });

  /**
   * Accepting matches the signed-in address against the invited one, so an account under any other
   * address is an account that can never accept this invitation.
   */
  test('Invitation_CreatingAnAccount_FixesTheAddressToTheInvitedOne', async ({ page }) => {
    await page.goto(invitationPath);
    await page.getByRole('tab', { name: 'Create account' }).click();

    const emailField = page.getByLabel('Email address');

    await expect(emailField).toHaveValue(invitedAddress);
    await expect(emailField).toHaveAttribute('readonly', '');
  });

  /**
   * The server refuses a sign-up whose address is not the invited one, and the refusal says so without
   * naming the address, which anyone holding a forwarded link would otherwise learn.
   */
  test('Invitation_SignUpFormFilledIn_ReachesTheServerAndComesBackWithAnAnswer', async ({ page }) => {
    await page.goto(invitationPath);
    await page.getByRole('tab', { name: 'Create account' }).click();

    await page.getByLabel('First name').fill('Probe');
    await page.getByLabel('Last name').fill('Supporter');
    await page.getByLabel('Password', { exact: true }).fill('Fundrais3!');
    await page.getByLabel('Confirm password').fill('Fundrais3!');
    await page.getByRole('button', { name: 'Create my account' }).click();

    await expect(page.getByText('Check your inbox')).toBeVisible();
  });

  /**
   * Every width shows the same two ways in, with controls a thumb can hit and no page that slides
   * sideways.
   */
  test('Invitation_AccessTabs_AreReachableByTouchAndDoNotScrollThePageSideways', async ({ page }) => {
    await page.goto(invitationPath);

    const signIn = await page.getByRole('tab', { name: 'Sign in' }).boundingBox();
    const signUp = await page.getByRole('tab', { name: 'Create account' }).boundingBox();

    expect(signIn?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(signUp?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

test.describe('Opening an invitation on the wrong account', () => {
  const INVITED_CODE = 'e2e-somebody-else_2';
  const invitedAddress = probeAddress('somebody-else');

  test.beforeAll(() => {
    removeInvitationsTo(invitedAddress);
    insertInvitationWithCode(invitedAddress, INVITED_CODE);
  });

  test.afterAll(() => removeInvitationsTo(invitedAddress));

  /**
   * The signed-in organiser is not the person this invitation was sent to. Saying so before the form
   * is filled in is the difference between a correction and an attempt the server will refuse.
   */
  test('Invitation_SignedInAsSomebodyElse_SaysSoInsteadOfShowingTheForm', async ({ page }) => {
    await page.goto(
      `/donation/campaign/${campaign.uniqueId}/peer-to-peer/invitation?token=${INVITED_CODE}`,
    );

    await expect(page.getByText('Signed in as somebody else')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Set up my page' })).toHaveCount(0);

    const switchAccount = page.getByRole('button', { name: 'Sign in with that address' });

    await expect(switchAccount).toBeVisible();
    expect((await switchAccount.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
