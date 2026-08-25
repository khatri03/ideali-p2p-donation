/** The six editable lifecycle emails, as the API describes them. */

export type EmailTemplateType =
  | 'Welcome'
  | 'FirstDonation'
  | 'MilestoneReached'
  | 'QuietWeek'
  | 'CampaignEnding'
  | 'ThankYou';

export interface EmailTemplate {
  templateType: EmailTemplateType;
  displayName: string;
  /** When this email goes out, in the words the organiser will judge it by. */
  whenItSends: string;
  subject: string;
  bodyHtml: string;
  isEnabled: boolean;
}

export interface EmailPlaceholder {
  displayText: string;
  placeHolderText: string;
}

export interface EmailTemplateListResult {
  campaignName: string;
  templates: EmailTemplate[];
  placeholders: EmailPlaceholder[];
}

export interface EmailTemplateUpdateRequest {
  templateType: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  isEnabled: boolean;
}

export interface EmailTemplateTestRequest {
  templateType: EmailTemplateType;
  emailAddress?: string;
}

export interface EmailTemplateResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
