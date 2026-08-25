import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailTemplateListResult } from 'app/interface/donationInter/peerToPeerEmailTemplateDto';

const get = vi.fn();
const put = vi.fn();
const post = vi.fn();

vi.mock('app/service/httpClient/HttpClient', () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    put: (...args: unknown[]) => put(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

const { getEmailTemplates, sendEmailTemplateTest, updateEmailTemplate } = await import(
  './peerToPeerEmailTemplateService'
);

const CAMPAIGN_ID = 'a7f3c2d1';
const BASE = `/api/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/email-templates`;

const listResult: EmailTemplateListResult = {
  campaignName: 'Winter appeal',
  templates: [
    {
      templateType: 'Welcome',
      displayName: 'Welcome',
      whenItSends: 'As soon as a page goes live.',
      subject: 'Your page is live',
      bodyHtml: '<p>Hello</p>',
      isEnabled: true,
    },
  ],
  placeholders: [],
};

beforeEach(() => {
  get.mockReset();
  put.mockReset();
  post.mockReset();
});

describe('getEmailTemplates', () => {
  it('Templates_Read_AsksTheCampaignsTemplateAddress', async () => {
    get.mockResolvedValue({ data: { success: true, data: listResult } });

    expect(await getEmailTemplates(CAMPAIGN_ID)).toEqual(listResult);
    expect(get).toHaveBeenCalledWith(BASE);
  });

  it('Templates_ResponseWithoutAList_IsRefusedRatherThanRendered', async () => {
    get.mockResolvedValue({ data: { success: true, data: { campaignName: 'Winter appeal' } } });

    await expect(getEmailTemplates(CAMPAIGN_ID)).rejects.toThrow();
  });

  it('Templates_ServerRefuses_RaisesTheServersOwnSentence', async () => {
    get.mockResolvedValue({ data: { success: false, message: 'Campaign not found.' } });

    await expect(getEmailTemplates(CAMPAIGN_ID)).rejects.toThrow('Campaign not found.');
  });

  it('Templates_CampaignIdentifier_IsEncodedBeforeItReachesTheUrl', async () => {
    get.mockResolvedValue({ data: { success: true, data: listResult } });

    await getEmailTemplates('a/../b');

    expect(get.mock.calls[0][0]).toContain('a%2F..%2Fb');
  });
});

describe('updateEmailTemplate', () => {
  it('Save_Edit_PutsTheWholeTemplateBackRatherThanAPatch', async () => {
    put.mockResolvedValue({ data: { success: true, message: 'Template saved.' } });

    const message = await updateEmailTemplate(CAMPAIGN_ID, {
      templateType: 'Welcome',
      subject: 'New subject',
      bodyHtml: '<p>New body</p>',
      isEnabled: false,
    });

    expect(put).toHaveBeenCalledWith(BASE, {
      templateType: 'Welcome',
      subject: 'New subject',
      bodyHtml: '<p>New body</p>',
      isEnabled: false,
    });
    expect(message).toBe('Template saved.');
  });

  it('Save_Refused_RaisesTheServersOwnSentence', async () => {
    put.mockResolvedValue({ data: { success: false, message: 'Write a subject line before saving.' } });

    await expect(
      updateEmailTemplate(CAMPAIGN_ID, {
        templateType: 'Welcome',
        subject: '',
        bodyHtml: '<p>Body</p>',
        isEnabled: true,
      }),
    ).rejects.toThrow('Write a subject line before saving.');
  });
});

describe('sendEmailTemplateTest', () => {
  it('Test_Request_PostsToTheTestAddressWithTheChosenTemplate', async () => {
    post.mockResolvedValue({ data: { success: true, message: 'Test sent to me@example.test.' } });

    const message = await sendEmailTemplateTest(CAMPAIGN_ID, {
      templateType: 'ThankYou',
      emailAddress: 'me@example.test',
    });

    expect(post).toHaveBeenCalledWith(`${BASE}/test`, {
      templateType: 'ThankYou',
      emailAddress: 'me@example.test',
    });
    expect(message).toBe('Test sent to me@example.test.');
  });

  it('Test_Refused_RaisesRatherThanClaimingItWentOut', async () => {
    post.mockResolvedValue({
      data: { success: false, message: 'That address has asked not to be emailed.' },
    });

    await expect(
      sendEmailTemplateTest(CAMPAIGN_ID, { templateType: 'Welcome' }),
    ).rejects.toThrow('That address has asked not to be emailed.');
  });
});
