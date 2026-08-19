import HttpClient from 'app/service/httpClient/HttpClient';

export interface MemberProfileResponse {
  uniqueId: string;
  invoiceUniqueId?: string | null;
  invoice?: {
    invoiceUniqueId: string | null;
  } | null;
  profile: {
    photoUrl: string | null;
  };
  contact: {
    prefix: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string;
    cellPhone: string;
  };
  address: {
    type: string | null;
    streetLine1: string | null;
    streetLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zipCode: string | null;
  };
  membership: {
    membershipTypeUniqueId: string;
    activeMembershipName: string;
    membershipStatus: string;
    membershipStartUtc: string | null;
    membershipExpiryUtc: string | null;
    notes: string | null;
  };
  membershipHistory: Array<{
    uniqueId: string;
    membershipName: string;
    membershipStatus: string;
    membershipExpiryUtc: string | null;
    invoiceUniqueId: string;
    invoiceNo: string;
    statusDateUtc: string | null;
  }>;
  customFormResponses: Array<Record<string, unknown>>;
  customQuestionResponses: Array<{
    questionUniqueId: string;
    questionLabel: string;
    controlType: string;
    optionLabel: string | null;
    fileStorageId: string | null;
    fileStorageUniqueId: string | null;
    fileOriginalFileName: string | null;
    fileContentType: string | null;
    fileSize: number | null;
    value: string | null;
  }>;
}

export interface MemberCustomFormItem {
  formUniqueId: string;
  formName: string;
  formHeaderText: string;
  formDescription: string | null;
  formLayoutColumn: number;
  displayOrder: number;
  answerCount: number;
}

export interface MemberCustomFormFieldItem {
  fieldUniqueId: string;
  fieldLabel: string;
  fieldType: string;
  fieldDisplayOrder: number;
  fieldLayoutColumn: number | null;
  value: string | null;
  fileStorageId: string | null;
  fileStorageUniqueId: string | null;
  fileOriginalFileName: string | null;
  fileContentType: string | null;
  fileSize: number | null;
}

export interface MemberCustomFormDetailResponse {
  memberUniqueId: string;
  membershipTypeUniqueId: string;
  formUniqueId: string;
  formName: string;
  formHeaderText: string;
  formDescription: string | null;
  formLayoutColumn: number;
  displayOrder: number;
  fields: MemberCustomFormFieldItem[];
}

export interface MemberActionResponse {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: unknown;
  meta: unknown;
  timestamp: string;
}

export interface MemberRefundRequest {
  invoiceUniqueId: string;
  reason: string;
}

const memberProfileService = {
  getMemberProfile: (uniqueId: string) =>
    HttpClient.get<{ data: MemberProfileResponse; success: boolean; message?: string }>(
      `/api/organizer/membership/type/members/${uniqueId}/detail`,
    ),

  getMemberCustomForms: (uniqueId: string) =>
    HttpClient.get<{ data: MemberCustomFormItem[]; success: boolean; message?: string }>(
      `/api/organizer/membership/type/members/${uniqueId}/custom-forms`,
    ),

  getMemberCustomFormDetail: (memberUniqueId: string, formUniqueId: string) =>
    HttpClient.get<{ data: MemberCustomFormDetailResponse; success: boolean; message?: string }>(
      `/api/organizer/membership/type/members/${memberUniqueId}/custom-forms/${formUniqueId}`,
    ),

  approveMember: (uniqueId: string) =>
    HttpClient.post<MemberActionResponse>(
      `/api/organizer/membership/type/members/${uniqueId}/approve`,
    ),

  rejectMember: (uniqueId: string, reason: string) =>
    HttpClient.post<MemberActionResponse>(
      `/api/organizer/membership/type/members/${uniqueId}/reject`,
      null,
      { params: { reason } },
    ),

  refundMemberPayment: (payload: MemberRefundRequest) =>
    HttpClient.post<MemberActionResponse>(
      '/api/donation/payment-merchant/member-payment/refund',
      payload,
    ),
};

export default memberProfileService;
