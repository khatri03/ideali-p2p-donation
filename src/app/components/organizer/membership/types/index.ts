// ─── Pricing ─────────────────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'annual' | 'lifetime' | 'one-time' | 'custom';

export interface PricingTier {
  id: number;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  description: string;
}

// ─── Benefits ────────────────────────────────────────────────────────────────

export interface MemberBenefit {
  id: number;
  title: string;
  description: string;
}

// ─── Custom Form Fields ───────────────────────────────────────────────────────

export type FieldType = 'text' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'textarea';

export interface CustomFormField {
  id: number;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

// ─── Auto Renewal ─────────────────────────────────────────────────────────────

export interface AutoRenewalSettings {
  enabled: boolean;
  reminderDays: number;
  gracePeriodDays: number;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

export interface EligibilitySettings {
  minAge?: number;
  maxAge?: number;
  requiresApproval: boolean;
  eligibilityNote: string;
}

// ─── Full Wizard State ────────────────────────────────────────────────────────

export interface MembershipWizardFormData {
  // Step 1: Basic Info
  name: string;
  startDate: Date | null;
  endDate: Date | null;

  // Step 2: Pricing Tiers
  pricingTiers: PricingTier[];

  // Step 3: Description
  description: string;

  // Step 4: Payment Account
  paymentAccountId: number;
  paymentMethods: string[];

  // Step 5: Member Benefits
  benefits: MemberBenefit[];

  // Step 6: Custom Form Fields
  customFields: CustomFormField[];

  // Step 7: Theme Color
  themeColor: string;

  // Step 8: Banner
  bannerImage: string | null;

  // Step 9: Thank You Email
  emailSubject: string;
  emailBody: string;

  // Step 10: Auto Renewal
  autoRenewal: AutoRenewalSettings;

  // Step 11: Eligibility
  eligibility: EligibilitySettings;
}

// ─── API DTOs ─────────────────────────────────────────────────────────────────

export interface CreateMembershipDto {
  name: string;
  startDate: string;
  endDate: string | null;
}

export interface MembershipListItem {
  uniqueId: string;
  name: string;
  displayOrder: number;
  hasDiscountCoupons: boolean;
  discountsEnabled: boolean;
  availableForSignUp: boolean;
  setupState: 'Published' | 'Draft' | 'Archived' | 'ReadyForReview';
  isFree: boolean;
  membershipCharges: number;
  paymentMerchant: string | null;
  paymentCurrencyCode: string | null;
  paymentCurrencySymbol: string | null;
  tenureText: string | null;
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  customExpiryDays: number | null;
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
}

// ─── Preview Data (passed from wizard → preview panel) ────────────────────────

export interface MembershipPreviewData {
  name: string;
  description: string;
  selectedColor: string;
  bannerImage: string | null;
  startDate?: Date;
  endDate?: Date;
  pricingTiers?: PricingTier[];
  benefits?: MemberBenefit[];
}

// ─── Wizard Sidebar Step ──────────────────────────────────────────────────────

export interface WizardStep {
  number: number;
  label: string;
  skippable?: boolean;
}

// ─── Public Registration ──────────────────────────────────────────────────────

export interface RegistrationFormField {
  id: number;
  uniqueId: string;
  formControlTypeId: number;
  controlUniqueId: string;
  displayOrder: number;
  controlLabel: string;
  placeHolder?: string;
  tooltip?: string;
  isMandatory: boolean;
  requiredMessage?: string;
  defaultValue?: string;
  minLength?: number | null;
  maxLength?: number | null;
  layoutColumn: number | null;
  options: Array<{ id: number; value: string; displayText: string; customFormFieldId: number }>;
}

export interface RegistrationCustomForm {
  id: number;
  uniqueId: string;
  headerText: string;
  name: string;
  description: string | null;
  layoutColumn: number;
  fields: RegistrationFormField[];
}

export interface RegistrationCustomQuestion {
  uniqueId: string;
  controlId: number;
  controlName: string;
  controlType: string;
  iconClass: string;
  label: string;
  placeHolder: string | null;
  tooltip: string | null;
  required: boolean;
  requiredMessage: string | null;
  acceptedFileTypes: string | null;
  minLength: string | null;
  maxLength: string | null;
  defaultValue: string | null;
  displayOrder: number;
  options: Array<{ uniqueId?: string; id?: number; value: string; displayText: string; isDefault?: boolean }>;
}

export interface MemberRegistrationInfo {
  organizerName: string;
  membershipDetail: {
    name: string;
    description: string;
    organizerName: string;
    tenure: string;
    isFree: boolean;
    membershipCharges: number;
    discountsEnabled: boolean;
    color: string;
    bannerUrl: string | null;
    customForms: RegistrationCustomForm[];
    customQuestions: RegistrationCustomQuestion[];
  };
  paymentSettings: {
    paymentAccountId: number;
    paymentAccountUniqueId: string;
    accountName: string;
    merchantName: string;
    paymentCurrencyCode: string;
    paymentCurrencySymbol: string;
    paymentProducts: Array<{ name: string; displayName: string }>;
  };
  presetTips: Array<{ percent: number; isDefault: boolean }>;
  registrationState: string;
  canRegister: boolean;
  discountsEnabled: boolean;
  hasActiveCoupons: boolean;
}

// ─── Shared Step Props ────────────────────────────────────────────────────────

export interface BaseStepProps {
  membershipId: string | null;
  onNext: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  isSubmitting: boolean;
}

// ─── Member Registration Step 2 ──────────────────────────────────────────────

export type Step2Errors = Partial<Record<
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'prefix'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'cellPhone'
  | 'addressType'
  | 'country'
  | 'state'
  | 'line1'
  | 'line2'
  | 'city'
  | 'zipCode',
  string
>>;
