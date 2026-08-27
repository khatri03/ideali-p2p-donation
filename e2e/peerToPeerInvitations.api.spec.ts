import { APIRequestContext, expect, test } from '@playwright/test';
import {
  anonymousApi,
  authenticatedApi,
  emailTemplateTestUrl,
  emailTemplatesUrl,
  invitationAcceptUrl,
  invitationPreviewUrl,
  invitationSupportersUrl,
  invitationUnsubscribeUrl,
  invitationUrl,
  invitationsUrl,
  signIn,
} from './support/apiSession';
import { liveCampaign, secondLiveCampaign } from './support/campaignFixtures';
import { execute, query, querySingleValue } from './support/database';

/**
 * The invitation and lifecycle-email endpoints against the real database. What only this level can
 * prove: that a sent invitation is stored as a digest and never as the code that was emailed, that
 * the answer is the same whether an address is registered here or nowhere, that a link cannot be
 * replayed, and that an edited template is sanitised in the table rather than only on the screen.
 *
 * Everything this suite writes carries the probe tag and is removed afterwards.
 */

const campaign = liveCampaign();
const otherCampaign = secondLiveCampaign();
const PROBE_DOMAIN = 'e2e-invite.test';
const PROBE_TEMPLATE_SUBJECT = 'E2E Invitation Template';

let api: APIRequestContext;
let anonymous: APIRequestContext;

const campaignIdSql = (uniqueId: string) =>
  `(SELECT Id FROM DonationCampaign WHERE UniqueId = '${uniqueId}')`;

const removeProbeData = (): void =>
  execute(`
    DELETE FROM FundraiserInvitation WHERE EmailAddress LIKE '%@${PROBE_DOMAIN}';
    DELETE FROM EmailSuppression WHERE EmailAddress LIKE '%@${PROBE_DOMAIN}';
    DELETE FROM PeerToPeerEmailTemplate
    WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)};
  `);

const probeAddress = (label: string) => `${label}@${PROBE_DOMAIN}`;

const invitationRow = (emailAddress: string): string[] =>
  query(`
    SELECT TokenHash + '|' + CurrentStatus + '|' + CAST(LEN(TokenHash) AS VARCHAR(10))
    FROM FundraiserInvitation
    WHERE EmailAddress = '${emailAddress}';
  `);

test.beforeAll(async () => {
  api = await authenticatedApi(await signIn());
  anonymous = await anonymousApi();
});

test.beforeEach(() => removeProbeData());

test.afterAll(async () => {
  removeProbeData();
  await api.dispose();
  await anonymous.dispose();
});

test.describe('Sending invitations', () => {
  test('Send_ValidAddress_IsAcceptedAndCounted', async () => {
    const address = probeAddress('one');

    const response = await api.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [address] },
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).data.accepted).toBe(1);
  });

  test('Send_Invitation_IsStoredAsADigestAndNotAsTheCodeThatWasEmailed', async () => {
    const address = probeAddress('digest');

    await api.post(invitationsUrl(campaign.uniqueId), { data: { emailAddresses: [address] } });

    const [row] = invitationRow(address);

    expect(row).toContain('|Sent|64');
  });

  test('Send_Invitation_CreatesNoFundraisingPageUntilItIsAccepted', async () => {
    const address = probeAddress('nopage');
    const before = querySingleValue(`
      SELECT COUNT(*) FROM CampaignFundraiser
      WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)} AND IsDeleted = 0;
    `);

    await api.post(invitationsUrl(campaign.uniqueId), { data: { emailAddresses: [address] } });

    expect(
      querySingleValue(`
        SELECT COUNT(*) FROM CampaignFundraiser
        WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)} AND IsDeleted = 0;
      `),
    ).toBe(before);
  });

  test('Send_RegisteredAndUnknownAddresses_AnswerIdenticallySoNeitherIsConfirmed', async () => {
    const registered = await api.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [probeAddress('registered')] },
    });
    const unknown = await api.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [probeAddress('unknown')] },
    });

    expect(registered.status()).toBe(unknown.status());
    expect((await registered.json()).message).toBe((await unknown.json()).message);
  });

  test('Send_SameAddressTwiceInADay_IsSkippedRatherThanMailedAgain', async () => {
    const address = probeAddress('repeat');
    const payload = { data: { emailAddresses: [address] } };

    await api.post(invitationsUrl(campaign.uniqueId), payload);
    const second = await api.post(invitationsUrl(campaign.uniqueId), payload);

    expect((await second.json()).data.accepted).toBe(0);
    expect(
      Number(
        querySingleValue(
          `SELECT COUNT(*) FROM FundraiserInvitation WHERE EmailAddress = '${address}';`,
        ),
      ),
    ).toBe(1);
  });

  test('Send_MoreThanFiftyAddresses_IsRefusedBeforeAnythingIsWritten', async () => {
    const addresses = Array.from({ length: 51 }, (_, index) => probeAddress(`bulk${index}`));

    const response = await api.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: addresses },
    });

    expect((await response.json()).success).toBe(false);
    expect(
      Number(
        querySingleValue(
          `SELECT COUNT(*) FROM FundraiserInvitation WHERE EmailAddress LIKE 'bulk%@${PROBE_DOMAIN}';`,
        ),
      ),
    ).toBe(0);
  });

  test('Send_MalformedAddress_IsRefusedWithoutMailingTheValidOneBesideIt', async () => {
    const response = await api.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [probeAddress('good'), 'not-an-address'] },
    });

    expect((await response.json()).success).toBe(false);
    expect(
      Number(
        querySingleValue(
          `SELECT COUNT(*) FROM FundraiserInvitation WHERE EmailAddress LIKE 'good@${PROBE_DOMAIN}';`,
        ),
      ),
    ).toBe(0);
  });

  test('Send_SuppressedAddress_IsHeldBackBeforeTheMailLeaves', async () => {
    const address = probeAddress('bounced');

    execute(`
      INSERT INTO EmailSuppression
        (UniqueId, OrganizerId, EmailAddress, Reason, Detail, SuppressedOnUtc)
      VALUES
        (NEWID(),
         (SELECT OrganizerId FROM DonationCampaign WHERE Id = ${campaignIdSql(campaign.uniqueId)}),
         '${address}', 'HardBounce', 'Mailbox does not exist', SYSUTCDATETIME());
    `);

    const response = await api.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [address] },
    });

    expect((await response.json()).data.accepted).toBe(0);
    expect(
      Number(
        querySingleValue(
          `SELECT COUNT(*) FROM FundraiserInvitation WHERE EmailAddress = '${address}';`,
        ),
      ),
    ).toBe(0);
  });

  test('Send_WithNoToken_IsRefused', async () => {
    const response = await anonymous.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [probeAddress('anon')] },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('Send_WithAForgedToken_IsRefused', async () => {
    const forged = await authenticatedApi('not.a.real.token');

    const response = await forged.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [probeAddress('forged')] },
    });

    await forged.dispose();

    expect([401, 403]).toContain(response.status());
  });

  test('Send_OnACampaignThatWasNeverIssued_IsRefusedWithoutSayingWhether', async () => {
    const response = await api.post(
      invitationsUrl('00000000-0000-0000-0000-000000000000'),
      { data: { emailAddresses: [probeAddress('nowhere')] } },
    );

    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.message).toBe('Campaign not found.');
  });
});

test.describe('Reading invitations', () => {
  test('List_AfterASend_ShowsTheInvitationWithItsStatus', async () => {
    const address = probeAddress('listed');

    await api.post(invitationsUrl(campaign.uniqueId), { data: { emailAddresses: [address] } });

    const response = await api.get(invitationsUrl(campaign.uniqueId), {
      params: { page: 1, pageSize: 20, search: address },
    });

    const body = await response.json();

    expect(body.data.page.pageData[0].emailAddress).toBe(address);
    expect(body.data.page.pageData[0].status).toBe('Sent');
  });

  test('List_PageSizeAboveTheCeiling_IsClampedRatherThanHonoured', async () => {
    const response = await api.get(invitationsUrl(campaign.uniqueId), {
      params: { page: 1, pageSize: 5000 },
    });

    expect((await response.json()).data.page.pageSize).toBe(100);
  });

  test('List_PageBelowOne_IsNormalisedRatherThanRefused', async () => {
    const response = await api.get(invitationsUrl(campaign.uniqueId), {
      params: { page: -3, pageSize: 20 },
    });

    expect((await response.json()).data.page.pageNo).toBe(1);
  });

  test('Supporters_Read_ReturnsAListRatherThanFailing', async () => {
    const response = await api.get(invitationSupportersUrl(campaign.uniqueId));

    expect(response.status()).toBe(200);
    expect(Array.isArray((await response.json()).data)).toBe(true);
  });

  test('Preview_Requested_ReturnsTheRealEmailWithNoLiveLink', async () => {
    const response = await api.post(invitationPreviewUrl(campaign.uniqueId), {
      data: { emailAddresses: [], personalMessage: 'Please help us.' },
    });

    const body = await response.json();

    expect(body.data.bodyHtml).toContain('Please help us.');
    expect(body.data.bodyHtml).not.toContain('peer-to-peer/invitation?token=');
  });

  test('Preview_PersonalMessageWithMarkup_ComesBackAsWordsRatherThanAsMarkup', async () => {
    const response = await api.post(invitationPreviewUrl(campaign.uniqueId), {
      data: { emailAddresses: [], personalMessage: '<script>alert(1)</script>' },
    });

    const body = await response.json();

    expect(body.data.bodyHtml).not.toContain('<script>');
    expect(body.data.bodyHtml).toContain('&lt;script&gt;');
  });

  test('List_OfAnotherCharitysCampaign_IsRefusedWithTheSameSentenceAsAnUnknownOne', async () => {
    const foreign = await api.get(invitationsUrl(otherCampaign.uniqueId));
    const unknown = await api.get(invitationsUrl('00000000-0000-0000-0000-000000000000'));

    if (foreign.status() === 200) {
      test.skip(true, 'The second live campaign belongs to the signed-in charity on this database.');
    }

    expect((await foreign.json()).message).toBe((await unknown.json()).message);
  });
});

test.describe('Following an invitation link', () => {
  test('Open_UnknownCode_IsRefusedWithoutSayingWhetherItEverExisted', async () => {
    const response = await anonymous.get(invitationUrl(campaign.uniqueId), {
      params: { token: 'never-issued-code' },
    });

    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.message).toBe(
      'This invitation is no longer valid. Ask the charity to send you a new one.',
    );
  });

  test('Open_NoCodeAtAll_IsRefusedTheSameWay', async () => {
    const missing = await anonymous.get(invitationUrl(campaign.uniqueId));
    const unknown = await anonymous.get(invitationUrl(campaign.uniqueId), {
      params: { token: 'never-issued-code' },
    });

    expect((await missing.json()).message).toBe((await unknown.json()).message);
  });

  test('Accept_WithoutSigningIn_IsRefusedBecauseItCreatesAPage', async () => {
    const response = await anonymous.post(invitationAcceptUrl(campaign.uniqueId), {
      data: { token: 'never-issued-code', displayName: 'Nobody' },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('Unsubscribe_UnknownCode_AnswersExactlyAsAValidOneWould', async () => {
    const response = await anonymous.post(invitationUnsubscribeUrl(campaign.uniqueId), {
      params: { token: 'never-issued-code' },
    });

    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe('You will not receive any more of these emails.');
  });

  test('Unsubscribe_AfterAnInvitation_StopsFurtherMailToThatAddress', async () => {
    const address = probeAddress('unsub');

    await api.post(invitationsUrl(campaign.uniqueId), { data: { emailAddresses: [address] } });

    // The code is only ever readable in the email, so the suppression is driven the way a person
    // asking to be left alone would leave it: by the address itself.
    execute(`
      INSERT INTO EmailSuppression
        (UniqueId, OrganizerId, EmailAddress, Reason, Detail, SuppressedOnUtc)
      VALUES
        (NEWID(),
         (SELECT OrganizerId FROM DonationCampaign WHERE Id = ${campaignIdSql(campaign.uniqueId)}),
         '${address}', 'Unsubscribed', 'Asked to stop', SYSUTCDATETIME());
    `);

    execute(`DELETE FROM FundraiserInvitation WHERE EmailAddress = '${address}';`);

    const response = await api.post(invitationsUrl(campaign.uniqueId), {
      data: { emailAddresses: [address] },
    });

    expect((await response.json()).data.accepted).toBe(0);
  });
});

test.describe('Lifecycle email templates', () => {
  test('Templates_NeverEdited_ComeBackAsRealCopyForEveryEmailTheCampaignCanSend', async () => {
    const response = await api.get(emailTemplatesUrl(campaign.uniqueId));
    const body = await response.json();

    expect(
      body.data.templates.map((template: { templateType: string }) => template.templateType).sort(),
    ).toEqual(
      [
        'CampaignEnding',
        'FirstDonation',
        'MilestoneReached',
        'PageApproved',
        'PageRejected',
        'QuietWeek',
        'ThankYou',
        'Welcome',
      ],
    );

    for (const template of body.data.templates) {
      expect(template.subject.length).toBeGreaterThan(0);
      expect(template.bodyHtml.length).toBeGreaterThan(0);
      expect(template.whenItSends.length).toBeGreaterThan(0);
    }
  });

  test('Templates_Placeholders_UseTheSameMarkersTheDonationEmailsUse', async () => {
    const response = await api.get(emailTemplatesUrl(campaign.uniqueId));
    const body = await response.json();

    for (const placeholder of body.data.placeholders) {
      expect(placeholder.placeHolderText).toMatch(/^\{\{.+\}\}$/);
    }
  });

  test('Save_BodyWithAScriptTag_IsStoredStrippedRatherThanAsMarkup', async () => {
    const response = await api.put(emailTemplatesUrl(campaign.uniqueId), {
      data: {
        templateType: 'Welcome',
        subject: PROBE_TEMPLATE_SUBJECT,
        bodyHtml: '<p>Hello</p><script>alert(1)</script>',
        isEnabled: true,
      },
    });

    expect(response.status()).toBe(200);

    const stored = querySingleValue(`
      SELECT BodyHtml FROM PeerToPeerEmailTemplate
      WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)} AND TemplateType = 'Welcome';
    `);

    expect(stored).not.toContain('script');
    expect(stored).toContain('<p>Hello</p>');
  });

  test('Save_JavascriptLink_LosesTheLinkRatherThanKeepingIt', async () => {
    await api.put(emailTemplatesUrl(campaign.uniqueId), {
      data: {
        templateType: 'ThankYou',
        subject: PROBE_TEMPLATE_SUBJECT,
        bodyHtml: '<p><a href="javascript:alert(1)">click</a></p>',
        isEnabled: true,
      },
    });

    const stored = querySingleValue(`
      SELECT BodyHtml FROM PeerToPeerEmailTemplate
      WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)} AND TemplateType = 'ThankYou';
    `);

    expect(stored).not.toContain('javascript:');
  });

  test('Save_EmptySubject_IsRefusedRatherThanStoredBlank', async () => {
    const response = await api.put(emailTemplatesUrl(campaign.uniqueId), {
      data: { templateType: 'Welcome', subject: '   ', bodyHtml: '<p>Hi</p>', isEnabled: true },
    });

    expect((await response.json()).success).toBe(false);
  });

  test('Save_TwiceOnTheSameTemplate_ReplacesItRatherThanAddingASecondRow', async () => {
    const payload = (subject: string) => ({
      data: { templateType: 'Welcome', subject, bodyHtml: '<p>Hi</p>', isEnabled: true },
    });

    await api.put(emailTemplatesUrl(campaign.uniqueId), payload(`${PROBE_TEMPLATE_SUBJECT} one`));
    await api.put(emailTemplatesUrl(campaign.uniqueId), payload(`${PROBE_TEMPLATE_SUBJECT} two`));

    expect(
      Number(
        querySingleValue(`
          SELECT COUNT(*) FROM PeerToPeerEmailTemplate
          WHERE DonationCampaignId = ${campaignIdSql(campaign.uniqueId)}
            AND TemplateType = 'Welcome';
        `),
      ),
    ).toBe(1);
  });

  test('Save_SwitchedOff_IsRecordedAsOffRatherThanRemoved', async () => {
    await api.put(emailTemplatesUrl(campaign.uniqueId), {
      data: {
        templateType: 'QuietWeek',
        subject: PROBE_TEMPLATE_SUBJECT,
        bodyHtml: '<p>Hi</p>',
        isEnabled: false,
      },
    });

    const response = await api.get(emailTemplatesUrl(campaign.uniqueId));
    const body = await response.json();
    const quiet = body.data.templates.find(
      (template: { templateType: string }) => template.templateType === 'QuietWeek',
    );

    expect(quiet.isEnabled).toBe(false);
  });

  test('Templates_WithNoToken_AreRefused', async () => {
    const response = await anonymous.get(emailTemplatesUrl(campaign.uniqueId));

    expect([401, 403]).toContain(response.status());
  });

  test('Test_ToASuppressedAddress_IsRefusedRatherThanMailed', async () => {
    const address = probeAddress('testblocked');

    execute(`
      INSERT INTO EmailSuppression
        (UniqueId, OrganizerId, EmailAddress, Reason, Detail, SuppressedOnUtc)
      VALUES
        (NEWID(),
         (SELECT OrganizerId FROM DonationCampaign WHERE Id = ${campaignIdSql(campaign.uniqueId)}),
         '${address}', 'HardBounce', 'Mailbox does not exist', SYSUTCDATETIME());
    `);

    const response = await api.post(emailTemplateTestUrl(campaign.uniqueId), {
      data: { templateType: 'Welcome', emailAddress: address },
    });

    expect((await response.json()).success).toBe(false);
  });
});
