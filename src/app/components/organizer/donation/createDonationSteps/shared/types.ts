import { createDonationDto, donationGoal, paymentAccountDto, CampaignData } from '../../../../../interface/donationInter/createDonationDto';
import { PaymentMerchantsOption, PaymentMethodOption } from '../../../../../interface/paymentMerchantsInter/paymentMerchantsResponseDto';

// ============================================
// SHARED STEP COMPONENT INTERFACES
// ============================================

/**
 * Common props shared across all step components
 */
export interface BaseStepProps {
  isSubmitting: boolean;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
}

/**
 * Step 1: Basic Information Props
 */
export interface Step1BasicInfoProps extends BaseStepProps {
  campaignData: createDonationDto;
  formData: {
    startDate: string;
    endDate: string;
  };
  nameError: string;
  startDateError: string;
  endDateError: string;
  onNameChange: (name: string) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveAndNext: () => Promise<void>;
  onBackToList: () => void;
}

/**
 * Step 2: Set Goal Props
 */
export interface Step2SetGoalProps extends BaseStepProps {
  donationGoal: donationGoal;
  showGoalInput: boolean;
  showFundraisingGoalInPreview: boolean;
  goalError: string;
  onGoalChange: (goal: number) => void;
  onShowGoalInputChange: (show: boolean) => void;
  onShowInPreviewChange: (show: boolean) => void;
  onSaveAndNext: () => Promise<void>;
  onSkip: () => void;
  onPrevStep: () => void;
}

/**
 * Step 3: Description Props
 */
export interface Step3DescriptionProps extends BaseStepProps {
  description: string;
  descriptionCharCount: number;
  maxLength: number;
  descriptionError: string;
  onDescriptionChange: (description: string, charCount: number) => void;
  onSaveAndNext: () => Promise<void>;
  onSkip: () => void;
  onPrevStep: () => void;
}

/**
 * Step 4: Payment Account Props
 */
export interface Step4PaymentAccountProps extends BaseStepProps {
  paymentAccountData: paymentAccountDto;
  paymentAccountList: PaymentMerchantsOption[];
  availablePaymentMethods: PaymentMethodOption[];
  loadingAccounts: boolean;
  loadingMethods: boolean;
  onAccountChange: (accountId: number) => void;
  onMethodsChange: (methods: string[]) => void;
  onSaveAndNext: () => Promise<void>;
  onPrevStep: () => void;
}

/**
 * Preset amount item structure
 */
export interface PresetAmountItem {
  id: number;
  amount: string;
  description: string;
}

/**
 * Preset amounts state structure
 */
export interface PresetAmountsState {
  oneTime: PresetAmountItem[];
  monthly: PresetAmountItem[];
  yearly: PresetAmountItem[];
}

/**
 * Step 5: Preset Donations Props
 */
export interface Step5PresetDonationsProps extends BaseStepProps {
  presetAmounts: PresetAmountsState;
  oneTimeEnabled: boolean;
  monthlyEnabled: boolean;
  yearlyEnabled: boolean;
  onAmountChange: (type: string, id: number, newAmount: string) => void;
  onDescriptionChange: (type: string, id: number, newDescription: string) => void;
  onToggleChange: (type: 'oneTime' | 'monthly' | 'yearly', enabled: boolean) => void;
  onSaveAndNext: () => Promise<void>;
  onSkip: () => void;
  onPrevStep: () => void;
}

/**
 * Step 6: Campaign Color Props
 */
export interface Step6CampaignColorProps extends BaseStepProps {
  selectedColor: string;
  availableColors: string[];
  onColorChange: (color: string) => void;
  onSaveAndNext: () => Promise<void>;
  onSkip: () => void;
  onPrevStep: () => void;
}

/**
 * Step 9: Review & Confirm Props
 */
export interface Step9ReviewConfirmProps extends BaseStepProps {
  campaignData: CampaignData | null;
  isLoading: boolean;
  isAlreadyPublished: boolean;
  onPublish: () => Promise<void>;
  onPrevStep: () => void;
  onBackToList: () => void;
}

/**
 * Step Navigation Buttons Props
 */
export interface StepNavigationButtonsProps {
  onPrev?: () => void;
  onSkip?: () => void;
  onNext: () => void | Promise<void>;
  onSaveAndExit?: () => void;
  prevLabel?: string;
  skipLabel?: string;
  nextLabel?: string;
  isSubmitting: boolean;
  isSavingAndExiting?: boolean;
  loadingText?: string;
  showSkip?: boolean;
  disableSkip?: boolean;
  disableNext?: boolean;
}
