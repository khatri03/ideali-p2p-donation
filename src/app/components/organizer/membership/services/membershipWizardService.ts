import HttpClient from 'app/service/httpClient/HttpClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardTitleResponse {
  UniqueId: string;
  name: string;
  stepNo: number;
}

export interface WizardDescriptionResponse {
  UniqueId: string;
  description: string;
  emailSubject: string;
  emailTemplate: string;
  notifyOrganizer: boolean;
  otherNotificationEmails: string;
  stepNo: number;
}

export interface WizardColorResponse {
  UniqueId: string;
  color: string;
  stepNo: number;
}

export interface WizardBannerResponse {
  UniqueId: string;
  bannerUrl: string;
  stepNo: number;
}

export interface WizardPaymentAccountPayload {
  paymentAccountUniqueId: string;
  paymentMethods: Array<string | number>;
}

export interface WizardPaymentAccountResponse {
  UniqueId: string;
  paymentAccountUniqueId: string;
  paymentMethods: number[];
  stepNo: number;
}

export interface PaymentAccountSelectionItem {
  uniqueId: string;
  name: string;
  paymentMerchant: string;
  paymentCurrency: string;
  tapToPayEnabled: boolean;
}

export interface PaymentAccountSelectionResponse {
  data: PaymentAccountSelectionItem[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface WizardPricingPayload {
  tenure: number;
  membershipCharges: number;
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
  customExpiryDays: number | null;
}

export interface WizardPricingResponse {
  uniqueId: string;
  tenure: number | null;
  membershipCharges: number;
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
  customExpiryDays: number | null;
  stepNo: number;
}

export interface WizardEmailResponse {
  UniqueId: string;
  emailSubject: string;
  emailBody: string;
  stepNo: number;
}

export interface WizardThankYouEmailResponse {
  uniqueId: string;
  emailSubject: string;
  emailTemplate: string;
  notifyOrganizer: boolean;
  otherNotificationEmails: string | null;
  stepNo: number;
}

export interface WizardAdvanceSettingsResponse {
  uniqueId: string;
  requiresApproval: boolean;
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  stepNo: number;
}

export interface UpgradePathPayload {
  toMembershipTypeUniqueId: string;
  chargeRule: 'FullPrice' | 'FixedAmount' | 'Free';
  fixedUpgradeAmount: number | null;
  requiresApproval: boolean;
  isActive: boolean;
}

export interface WizardAdvanceSettingsPayload {
  requiresApproval: boolean;
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  upgradePaths: UpgradePathPayload[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

const membershipWizardService = {
  // ── Create / Update ───────────────────────────────────────────────────────
  createMembership: (dto: unknown) =>
    HttpClient.post('/api/organizer/membership/type/create', dto),

  updateBasicInfo: (membershipId: string, dto: unknown) =>
    HttpClient.put(`/api/organizer/membership/type/${membershipId}/basic-info`, dto),

  setPricingTiers: (membershipId: string, payload: unknown) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/pricing`, payload),

  setDescription: (membershipId: string, description: string) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/description`, { description }),

  saveWizardPaymentAccount: (id: string, payload: WizardPaymentAccountPayload, stepNumber = 5) =>
    HttpClient.post<{ data: WizardPaymentAccountResponse }>(
      `/api/organizer/membership/type/wizard/${id}/payment-account?stepNumber=${stepNumber}`,
      {
        paymentAccountUniqueId: payload.paymentAccountUniqueId,
        paymentMethods: payload.paymentMethods.map(Number).filter(Number.isFinite),
      },
    ),

  getPaymentAccountSelectionItems: () =>
    HttpClient.get<PaymentAccountSelectionResponse>(
      '/api/organizer/payment-account/selection-items',
    ),

  setPaymentAccount:  (membershipId: string, payload: unknown) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/payment-account`, payload),

  setCustomFields:    (membershipId: string, payload: unknown) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/form-fields`, payload),

  setDiscountCoupons: (membershipId: string, payload: unknown) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/discount-coupons`, payload),

  setAdvanceSettings: (membershipId: string, payload: unknown) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/advance-settings`, payload),

  setThemeColor: (membershipId: string, color: string) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/theme`, { color }),

  setBanner: (membershipId: string, formData: FormData) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  setEmailTemplate: (membershipId: string, payload: { emailSubject: string; emailBody: string }) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/email-template`, payload),

  setAutoRenewal: (membershipId: string, payload: unknown) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/auto-renewal`, payload),

  setEligibility: (membershipId: string, payload: unknown) =>
    HttpClient.post(`/api/organizer/membership/type/${membershipId}/eligibility`, payload),

  // ── Read / Detail ─────────────────────────────────────────────────────────
  getById:          (membershipId: string) => HttpClient.get(`/api/organizer/membership/type/${membershipId}`),
  getDetailForEdit: (membershipId: string) => HttpClient.get(`/api/organizer/membership/type/${membershipId}/edit`),
  getReviewData:    (membershipId: string) => HttpClient.get(`/api/organizer/membership/type/${membershipId}/review`),

  getWizardProgress: async (membershipId: string): Promise<number> => {
    const res = await HttpClient.get<{ data: number }>(
      `/api/organizer/membership/type/wizard/${membershipId}/progress`,
    );
    return res.data.data ?? 0;
  },

  getBannerBlob: async (imageId: string): Promise<string> => {
    const res = await HttpClient.get(`/api/organizer/membership/type/banner/${imageId}`, { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },

  // ── Step 1: Title ─────────────────────────────────────────────────────────
  createWizardTitle:  (name: string) => HttpClient.post('/api/organizer/membership/type/wizard/title', { name }),
  getWizardTitle:     (id: string)   => HttpClient.get<{ data: WizardTitleResponse }>(`/api/organizer/membership/type/wizard/${id}/title`),
  updateWizardTitle:  (id: string, name: string, stepNumber: number) =>
    HttpClient.post<{ data: WizardTitleResponse }>(`/api/organizer/membership/type/wizard/${id}/title?stepNumber=${stepNumber}`, { name }),

  // ── Step 2: Description ───────────────────────────────────────────────────
  getWizardDescription: (id: string) =>
    HttpClient.get<{ data: WizardDescriptionResponse }>(`/api/organizer/membership/type/wizard/${id}/description`),

  saveWizardDescription: (id: string, payload: {
    description: string; emailSubject: string | null; emailTemplate: string;
    notifyOrganizer: boolean; otherNotificationEmails: string | null;
  }, stepNumber: number) =>
    HttpClient.post(`/api/organizer/membership/type/wizard/${id}/description?stepNumber=${stepNumber}`, payload),

  // ── Step 3: Color ─────────────────────────────────────────────────────────
  getWizardColor:  (id: string) =>
    HttpClient.get<{ data: WizardColorResponse }>(`/api/organizer/membership/type/wizard/${id}/color`),
  saveWizardColor: (id: string, color: string, stepNumber: number) =>
    HttpClient.post(`/api/organizer/membership/type/wizard/${id}/color?stepNumber=${stepNumber}`, { color }),

  // ── Step 4: Banner ────────────────────────────────────────────────────────
  getWizardBanner: (id: string) =>
    HttpClient.get<{ data: WizardBannerResponse }>(`/api/organizer/membership/type/wizard/${id}/banner`),

  saveWizardBanner: (id: string, file: File | Blob, stepNumber: number) => {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'banner.png');
    return HttpClient.post(
      `/api/organizer/membership/type/wizard/${id}/banner?stepNumber=${stepNumber}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  // ── Step 5: Payment Account ───────────────────────────────────────────────
  getWizardPaymentAccount: (id: string) =>
    HttpClient.get<{ data: WizardPaymentAccountResponse }>(`/api/organizer/membership/type/wizard/${id}/payment-account`),

  // ── Step 6: Pricing ───────────────────────────────────────────────────────
  getWizardPricing: (id: string) =>
    HttpClient.get<{ data: WizardPricingResponse }>(`/api/organizer/membership/type/wizard/${id}/pricing`),
  saveWizardPricing: (id: string, payload: WizardPricingPayload, stepNumber: number) =>
    HttpClient.post<{ data: string; success: boolean; message: string }>(
      `/api/organizer/membership/type/wizard/${id}/pricing?stepNumber=${stepNumber}`, payload,
    ),

  // ── Step 7: Discount Coupons ──────────────────────────────────────────────
  batchSaveDiscountCoupons: (payload: {
    moduleType: string; moduleEntityUniqueId: string; discountsEnabled: boolean;
    coupons: Array<{ uniqueId?: string; code: string; discountType: 'FixedAmount' | 'Percentage';
      discountValue: number; maxDiscountAmount: number | null; totalCoupons: number | null; isActive: boolean }>;
    deletedCouponIds: string[];
  }) =>
    HttpClient.post<{ data: string; success: boolean; message: string }>('/api/organizer/discount/coupon/batch-save', payload),

  getDiscountCoupons: (id: string) =>
    HttpClient.get<{ data: { discountsEnabled: boolean; coupons: Array<{
      uniqueId: string; code: string; moduleType: string; discountType: 'FixedAmount' | 'Percentage';
      discountValue: number; maxDiscountAmount: number | null; totalCoupons: number; usageCount: number; isActive: boolean;
    }> } }>(`/api/organizer/membership/type/${id}/discount-coupons`),

  getWizardDiscountCoupons: (id: string) =>
    HttpClient.get(`/api/organizer/membership/type/wizard/${id}/discount-coupons`),
  saveWizardDiscountCoupons: (id: string, payload: unknown, stepNumber: number) =>
    HttpClient.post(`/api/organizer/membership/type/wizard/${id}/discount-coupons?stepNumber=${stepNumber}`, payload),

  // ── Custom Forms (Step 8 support) ─────────────────────────────────────────
  getCustomFormControls: () =>
    HttpClient.get<{ data: Array<{ id: number; name: string; controlType: string; iconClass: string;
      defaultLabel: string; canBeRequired: boolean; hasOptions: boolean; canHavePlaceHolder: boolean;
      canHaveMinLength: boolean; canHaveMaxLength: boolean;
      acceptedFileTypes: Array<{ text: string; value: string }> | null }> }>('/api/organizer/custom-form/controls'),

  getCustomFormListItems: () =>
    HttpClient.get<{ data: Array<{ text: string; value: string }>; success: boolean }>('/api/organizer/custom-form/list-items'),

  getCustomFormDetail: (uniqueId: string) =>
    HttpClient.get<{ data: { uniqueId: string; headerText: string; name: string; description: string;
      layoutColumn: number; fields: Array<{ id: number; uniqueId: string; displayOrder: number;
      controlLabel: string; placeHolder?: string; tooltip?: string; isMandatory: boolean;
      defaultValue?: string; layoutColumn: number | null;
      options: Array<{ id: number; value: string; displayText: string }>;
      formControl: { controlType: string; name: string } }> } }>(`/api/organizer/custom-form/${uniqueId}/edit`),

  // ── Step 8: Questions ─────────────────────────────────────────────────────
  getWizardQuestions: (id: string) =>
    HttpClient.get<{ data: { customFormUniqueIds: string[]; customQuestions: Array<{
      uniqueId: string; controlId: number; controlName: string; controlType: string; iconClass: string;
      label: string; placeHolder: string; tooltip: string; required: boolean; requiredMessage: string;
      acceptedFileTypes: string; minLength: string; maxLength: string; defaultValue: string;
      displayOrder: number; options: Array<{ uniqueId: string; displayText: string; value: string; isDefault: boolean }> }> } }>(
      `/api/organizer/membership/type/wizard/${id}/questions`),

  saveWizardQuestions: (id: string, payload: { customFormUniqueIds: string[];
    customQuestions: Array<{ uniqueId?: string; controlId: number; controlName: string; controlType: string;
      iconClass: string; label: string; placeHolder: string; tooltip: string; required: boolean;
      requiredMessage: string; acceptedFileTypes: string; minLength: string; maxLength: string;
      defaultValue: string; displayOrder: number;
      options: Array<{ uniqueId?: string; displayText: string; value: string; isDefault: boolean }> }> }, stepNumber: number) =>
    HttpClient.post(`/api/organizer/membership/type/wizard/${id}/questions?stepNumber=${stepNumber}`, payload),

  // ── Step 9: Thank-You Email ───────────────────────────────────────────────
  getWizardEmail:        (id: string) => HttpClient.get<{ data: WizardEmailResponse }>(`/api/organizer/membership/type/wizard/${id}/email`),
  getWizardThankYouEmail: (id: string) => HttpClient.get<{ data: WizardThankYouEmailResponse }>(`/api/organizer/membership/type/wizard/${id}/thank-you-email`),
  saveWizardThankYouEmail: (id: string, payload: { emailSubject: string; emailTemplate: string; notifyOrganizer: boolean; otherNotificationEmails: string }, stepNumber: number) =>
    HttpClient.post(`/api/organizer/membership/type/wizard/${id}/thank-you-email?stepNumber=${stepNumber}`, payload),

  // ── Step 10: Upgrade Paths & Advance Settings ─────────────────────────────
  getUpgradePaths: (membershipId: string) =>
    HttpClient.get<{ data: Array<{ uniqueId: string; toMembershipTypeUniqueId: string; toMembershipTypeName: string;
      chargeRule: 'FullPrice' | 'FixedAmount' | 'Free'; fixedUpgradeAmount: number | null;
      requiresApproval: boolean; isActive: boolean }> }>(`/api/organizer/membership/type/${membershipId}/upgrade-paths`),

  getWizardAdvanceSettings: (id: string) =>
    HttpClient.get<{ data: WizardAdvanceSettingsResponse }>(`/api/organizer/membership/type/wizard/${id}/advance-settings`),
  saveWizardAdvanceSettings: (id: string, payload: WizardAdvanceSettingsPayload, stepNumber: number) =>
    HttpClient.post<{ data: string; success: boolean }>(`/api/organizer/membership/type/wizard/${id}/advance-settings?stepNumber=${stepNumber}`, payload),

  // ── Step 11: Review ───────────────────────────────────────────────────────
  getWizardReview: (id: string) =>
    HttpClient.get<{ data: { uniqueId: string; name: string; color: string;
      paymentAccount: { name: string; merchant: string; currency: string } | null;
      isFree: boolean; membershipCharges: number; tenure: number | null;
      annualExpiryMonth: number | null; annualExpiryDay: number | null; customExpiryDays: number | null;
      discountsEnabled: boolean; hasQuestions: boolean; requiresApproval: boolean;
      registrationStartDateUtc: string | null; registrationEndDateUtc: string | null;
      publishedAtUtc: string | null; setupState: string; availableForSignUp: boolean; stepNo: number } }>(
      `/api/organizer/membership/type/wizard/${id}/review-data`),

  saveReviewData: (id: string, availableForSignUp: boolean) =>
    HttpClient.post<{ data: string; success: boolean }>(
      `/api/organizer/membership/type/wizard/${id}/review-data?stepNumber=11`, { availableForSignUp }),

  // ── Membership type list (used in wizard dropdowns) ───────────────────────
  getMembershipList: async () => {
    const res = await HttpClient.get<{ data: { pageData: Array<{ uniqueId: string; name: string }> } }>(
      '/api/organizer/membership/type/list?pageNo=1&pageSize=1000',
    );
    return res.data.data?.pageData ?? [];
  },
};

export default membershipWizardService;
