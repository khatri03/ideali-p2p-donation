import {
  Invitation,
  InvitationListResult,
  InvitationSummary,
} from 'app/interface/donationInter/fundraiserInvitationDto';
import {
  EmailTemplate,
  EmailTemplateListResult,
} from 'app/interface/donationInter/peerToPeerEmailTemplateDto';

export const CAMPAIGN_UNIQUE_ID = '11111111-2222-3333-4444-555555555555';

export const buildInvitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  uniqueId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  emailAddress: 'sara@example.test',
  status: 'Sent',
  invitedByName: 'Hope Foundation',
  createdOnUtc: '2026-03-01T09:00:00Z',
  expiresOnUtc: '2026-03-15T09:00:00Z',
  openedOnUtc: null,
  acceptedOnUtc: null,
  suppressionReason: null,
  ...overrides,
});

export const buildSummary = (overrides: Partial<InvitationSummary> = {}): InvitationSummary => ({
  sent: 1,
  opened: 0,
  accepted: 0,
  expired: 0,
  suppressed: 0,
  ...overrides,
});

export const buildInvitationList = (
  invitations: Invitation[] = [buildInvitation()],
  overrides: Partial<InvitationListResult> = {},
): InvitationListResult => ({
  campaignName: 'Winter appeal',
  summary: buildSummary(),
  page: {
    pageNo: 1,
    pageSize: 20,
    pageCount: 1,
    totalRecordsCount: invitations.length,
    pageData: invitations,
  },
  ...overrides,
});

export const buildTemplate = (overrides: Partial<EmailTemplate> = {}): EmailTemplate => ({
  templateType: 'Welcome',
  displayName: 'Welcome',
  whenItSends: 'As soon as a page goes live.',
  subject: 'Your fundraising page is live',
  bodyHtml: '<p>Thank you for fundraising.</p>',
  isEnabled: true,
  ...overrides,
});

export const buildTemplateList = (
  templates: EmailTemplate[] = [buildTemplate()],
): EmailTemplateListResult => ({
  campaignName: 'Winter appeal',
  templates,
  placeholders: [{ displayText: 'Campaign name', placeHolderText: '{{CampaignName}}' }],
});
