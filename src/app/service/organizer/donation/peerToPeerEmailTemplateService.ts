import HttpClient from '../../httpClient/HttpClient';
import {
  EmailTemplateListResult,
  EmailTemplateResponse,
  EmailTemplateTestRequest,
  EmailTemplateUpdateRequest,
} from 'app/interface/donationInter/peerToPeerEmailTemplateDto';

const LIST_FAILED = 'The lifecycle emails on this campaign could not be read.';
const SAVE_FAILED = 'That template could not be saved.';
const TEST_FAILED = 'That test could not be sent.';

/**
 * The campaign identifier comes from the address bar, so it is caller input and is encoded. Whether
 * the campaign belongs to the signed-in charity is decided by the server, never here.
 */
const templatesUrl = (campaignUniqueId: string) =>
  `/api/donation/campaign/${encodeURIComponent(campaignUniqueId)}/peer-to-peer/email-templates`;

export const getEmailTemplates = async (
  campaignUniqueId: string,
): Promise<EmailTemplateListResult> => {
  const { data } = await HttpClient.get<EmailTemplateResponse<EmailTemplateListResult>>(
    templatesUrl(campaignUniqueId),
  );

  if (!data?.success || !data.data || !Array.isArray(data.data.templates)) {
    throw new Error(data?.message ?? LIST_FAILED);
  }

  return data.data;
};

export const updateEmailTemplate = async (
  campaignUniqueId: string,
  request: EmailTemplateUpdateRequest,
): Promise<string> => {
  const { data } = await HttpClient.put<EmailTemplateResponse<unknown>>(
    templatesUrl(campaignUniqueId),
    request,
  );

  if (!data?.success) {
    throw new Error(data?.message ?? SAVE_FAILED);
  }

  return data.message ?? 'Template saved.';
};

export const sendEmailTemplateTest = async (
  campaignUniqueId: string,
  request: EmailTemplateTestRequest,
): Promise<string> => {
  const { data } = await HttpClient.post<EmailTemplateResponse<unknown>>(
    `${templatesUrl(campaignUniqueId)}/test`,
    request,
  );

  if (!data?.success) {
    throw new Error(data?.message ?? TEST_FAILED);
  }

  return data.message ?? 'Test sent.';
};
