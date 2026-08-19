import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, useDisclosure, useToast } from '@chakra-ui/react';
import {
  createDonationDto,
  descriptionDto,
  donationGoal,
  paymentAccountDto,
  CampaignData,
} from '../../../interface/donationInter/createDonationDto';
import {
  PaymentMerchantsOption,
  PaymentMethodOption,
} from '../../../interface/paymentMerchantsInter/paymentMerchantsResponseDto';
import CommonMethod from 'app/service/helpers/commonMethod';
import helpers from 'app/service/helpers/commonMethod';
import donationService from '../../../service/organizer/donation/donationService';
import { getTextLength } from '../../../utils/textUtils';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setFormData as setReduxFormData,
  completeStep,
  setCampaignId,
  updateBasicInfo,
  createCampaign,
} from '../../../../store/slices/donationSlice';

// Import Step Components
import {
  Step1BasicInfo,
  Step2SetGoal,
  Step3Description,
  Step4PaymentAccount,
  Step5PresetDonations,
  Step6CampaignColor,
  Step7BannerUpload,
  Step8ThankYouEmail,
  Step9ReviewConfirm,
  CampaignSuccessModal,
  PresetAmountsState,
} from './createDonationSteps';

// ============================================
// TYPES & CONSTANTS
// ============================================

type FormData = {
  name: string;
  startDate: string;
  endDate: string;
  email: string;
  phone: string;
  amount: string;
  fundRaisingGoal: number;
  visibleToDonor: boolean;
  type: string;
  purpose: string;
  card: string;
  description: string;
  paymentAccountId: number;
  paymentMethods: string[];
  presetAmounts?: {
    oneTime?: {
      enabled: boolean;
      presetDetails: Array<{ amount: number; description: string }>;
    };
    monthly?: {
      enabled: boolean;
      presetDetails: Array<{ amount: number; description: string }>;
    };
    yearly?: {
      enabled: boolean;
      presetDetails: Array<{ amount: number; description: string }>;
    };
  };
  themeColor?: string;
  selectedColor?: string;
  bannerImage?: string | null;
  enableMonthlyRecurring?: boolean;
  enableYearlyRecurring?: boolean;
  customFormId?: number | null;
  emailSubject?: string;
  emailBody?: string;
};

const DESCRIPTION_MAX_LENGTH = 2000;

const initialFormData: FormData = {
  name: '',
  startDate: new Date().toString(),
  endDate: null,
  fundRaisingGoal: null,
  visibleToDonor: true,
  //Step: 3
  description: ' ',
  paymentAccountId: 0,
  paymentMethods: [],
  email: '',
  phone: '',
  amount: '',
  type: 'one-time',
  purpose: '',
  card: '',
};

interface CreateDonationModuleProps {
  onFormDataChange?: (data: {
    name: string;
    description: string;
    fundRaisingGoal: number;
    selectedColor: string;
    startDate: Date;
    endDate: Date;
    bannerImage: string | null;
    visibleToDonor: boolean;
    showFundraisingGoal: boolean;
    presetAmounts: {
      oneTime: {
        enabled: boolean;
        amounts: { amount: number; description: string }[];
      };
      monthly: {
        enabled: boolean;
        amounts: { amount: number; description: string }[];
      };
      yearly: {
        enabled: boolean;
        amounts: { amount: number; description: string }[];
      };
    };
  }) => void;
  onStepChange?: (step: number) => void;
  onStepComplete?: (step: number) => void;
  initialStep?: number;
  campaignId?: string;
  initialData?: Partial<FormData>;
  saveAndExitTrigger?: number;
  onSaveAndExitComplete?: () => void;
}

// Available colors for campaign theme
const availableColors = [
  '#041470',
  '#08243f',
  '#051180',
  '#bd0d53',
  '#a16c0f',
  '#0ca140',
  '#2b0561',
  '#0a55b6',
];

// Default preset amounts
const defaultPresetAmounts: PresetAmountsState = {
  oneTime: [
    { id: 1, amount: '10.00', description: '' },
    { id: 2, amount: '25.00', description: '' },
    { id: 3, amount: '50.00', description: '' },
    { id: 4, amount: '100.00', description: '' },
  ],
  monthly: [
    { id: 1, amount: '15.00', description: '' },
    { id: 2, amount: '30.00', description: '' },
    { id: 3, amount: '75.00', description: '' },
    { id: 4, amount: '150.00', description: '' },
  ],
  yearly: [
    { id: 1, amount: '120.00', description: '' },
    { id: 2, amount: '250.00', description: '' },
    { id: 3, amount: '500.00', description: '' },
    { id: 4, amount: '1000.00', description: '' },
  ],
};

export default function CreateDonationModule({
  onFormDataChange,
  onStepChange,
  onStepComplete,
  initialStep = 1,
  campaignId,
  initialData,
  saveAndExitTrigger = 0,
  onSaveAndExitComplete,
}: CreateDonationModuleProps = {}) {
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useAppDispatch();

  // Redux state
  const { campaignId: reduxCampaignId } = useAppSelector(
    (state) => state.donation,
  );

  // ============================================
  // STATE DECLARATIONS
  // ============================================

  // Step management
  const [step, setStep] = useState<number>(initialStep);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);

  // Step 1: Basic Info
  const [nameError, setNameError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [UniqueId, setUniqueId] = useState('');
  const [createDonationData, setCreateDonationData] =
    useState<createDonationDto>({
      name: '',
      startDate: new Date(),
      endDate: new Date(),
    });
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    ...initialData,
  });

  // Step 2: Goal
  const [FundGoalError, setFundGoalError] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [showFundraisingGoalInPreview, setShowFundraisingGoalInPreview] =
    useState(true);
  const [donationGoalState, setDonationGoalState] = useState<donationGoal>({
    fundRaisingGoal: 0,
  });

  // Step 3: Description
  const [descriptionError, setDescriptionError] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [descriptionData, setDescriptionData] = useState<descriptionDto>({
    description: ' ',
  });
  const [descriptionCharCount, setDescriptionCharCount] = useState(0);

  // Step 4: Payment Account
  const [paymentAccountData, setPaymentAccountData] =
    useState<paymentAccountDto>({
      paymentAccountId: 0,
      paymentMethods: [],
    });
  const [paymentAccountList, setPaymentAccountList] = useState<
    PaymentMerchantsOption[]
  >([]);
  const [loadingPaymentAccounts, setLoadingPaymentAccounts] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    PaymentMethodOption[]
  >([]);
  const [loadingMethods, setLoadingMethods] = useState(false);

  // Step 5: Preset Donations
  const [oneTimeEnabled, setOneTimeEnabled] = useState(true);
  const [monthlyEnabled, setMonthlyEnabled] = useState(false);
  const [yearlyEnabled, setYearlyEnabled] = useState(false);
  const [presetAmounts, setPresetAmounts] =
    useState<PresetAmountsState>(defaultPresetAmounts);

  // Step 6: Campaign Color
  const [selectedColor, setSelectedColor] = useState('#1635a7');

  // Step 7: Banner
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isFetchingBanner, setIsFetchingBanner] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [bannerSource, setBannerSource] = useState<'upload' | 'ai' | null>(
    null,
  );
  const [tabIndex, setTabIndex] = useState(0);

  // Step 8: Email Template
  const [emailSubject, setEmailSubject] = useState('Thank you for Donation');
  const [emailBody, setEmailBody] = useState('');

  // Step 9: Review & Confirm
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showConfetti, setShowConfetti] = useState(false);

  // Track if initial data has been loaded
  const [hasInitializedData, setHasInitializedData] = useState(false);

  // Save and Exit state
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  // Sync step with parent component
  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  // Initialize auth check
  useEffect(() => {
    const session = localStorage.getItem('AuthToken');
    const role = localStorage.getItem('userRole');
    let currentRole = localStorage.getItem('currentRole');

    if (!session || !role) {
      navigate('/auth/sign-in/custom');
      return;
    }

    const roles = role.split(',').map((r) => r.trim().toLowerCase());
    const isOrganizer = roles.includes('organizer');

    if (isOrganizer && currentRole?.toLowerCase() !== 'organizer') {
      currentRole = 'organizer';
      localStorage.setItem('currentRole', currentRole);
    }

    if (currentRole?.toLowerCase() !== 'organizer') {
      navigate('/auth/sign-in/custom');
    }
  }, [navigate]);

  // Notify parent when step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  // Fetch email template when navigating to step 8
  useEffect(() => {
    const fetchEmailTemplate = async () => {
      if (step === 8 && UniqueId) {
        try {
          const emailTemplateData =
            await donationService.getEmailTemplate(UniqueId);
          if (emailTemplateData) {
            if (emailTemplateData.emailSubject) {
              setEmailSubject(emailTemplateData.emailSubject);
            }
            if (emailTemplateData.emailBody) {
              setEmailBody(emailTemplateData.emailBody);
            }
          }
        } catch (error) {
          console.error('Error fetching email template:', error);
        }
      }
    };

    fetchEmailTemplate();
  }, [step, UniqueId]);

  // Fetch payment accounts on step 4
  useEffect(() => {
    if (step === 4) {
      fetchPaymentAccounts();
    }
  }, [step]);

  // useEffect(() => {
  //   if (availablePaymentMethods.length > 0 && paymentAccountData.paymentAccountId > 0) {

  //     // ✅ If methods already restored from saved data, don't overwrite
  //     if (paymentAccountData.paymentMethods.length > 0) return;

  //     const creditCardMethod = availablePaymentMethods.find(
  //       (method) =>
  //         method.text.toLowerCase().includes('credit') ||
  //         method.text.toLowerCase().includes('card'),
  //     );

  //     if (creditCardMethod) {
  //       setPaymentAccountData((prev) => ({
  //         ...prev,
  //         paymentMethods: [String(creditCardMethod.value)],
  //       }));
  //     }
  //   }
  // }, [availablePaymentMethods]);

  // Fetch campaign data for review (Step 9)
  useEffect(() => {
    const fetchCampaignData = async () => {
      setIsCheckingStatus(true);
      try {
        const response = await donationService.getCampaignReviewData(UniqueId);
        if (response?.data) {
          setCampaignData(response.data);
        }
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    if (UniqueId && step === 9) {
      fetchCampaignData();
    }
  }, [UniqueId, step]);

  // Update parent with form data changes
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange({
        name: createDonationData.name || '',
        description: descriptionData.description || '',
        fundRaisingGoal: donationGoalState.fundRaisingGoal || 0,
        selectedColor: selectedColor,
        startDate: createDonationData.startDate,
        endDate: createDonationData.endDate,
        bannerImage: bannerPreview,
        visibleToDonor: showFundraisingGoalInPreview,
        showFundraisingGoal: showFundraisingGoalInPreview,
        presetAmounts: {
          oneTime: {
            enabled: oneTimeEnabled,
            amounts: presetAmounts.oneTime.map((p) => ({
              amount: parseFloat(p.amount) || 0,
              description: p.description,
            })),
          },
          monthly: {
            enabled: monthlyEnabled,
            amounts: presetAmounts.monthly.map((p) => ({
              amount: parseFloat(p.amount) || 0,
              description: p.description,
            })),
          },
          yearly: {
            enabled: yearlyEnabled,
            amounts: presetAmounts.yearly.map((p) => ({
              amount: parseFloat(p.amount) || 0,
              description: p.description,
            })),
          },
        },
      });
    }
  }, [
    createDonationData,
    descriptionData,
    donationGoalState,
    selectedColor,
    bannerPreview,
    onFormDataChange,
    showFundraisingGoalInPreview,
    oneTimeEnabled,
    monthlyEnabled,
    yearlyEnabled,
    presetAmounts,
  ]);

  // Initialize form data when editing existing campaign
  useEffect(() => {
    if (initialData && campaignId && !hasInitializedData) {
      // Step 1: Basic Information
      if (initialData.name || initialData.startDate || initialData.endDate) {
        setCreateDonationData({
          name: initialData.name || '',
          startDate: initialData.startDate
            ? new Date(initialData.startDate)
            : new Date(),
          endDate: initialData.endDate
            ? new Date(initialData.endDate)
            : new Date(),
        });
        setUniqueId(campaignId);
        onStepComplete?.(1);
      }

      // Step 2: Set Goal
      if (
        initialData.fundRaisingGoal !== undefined &&
        initialData.fundRaisingGoal !== null
      ) {
        setDonationGoalState({ fundRaisingGoal: initialData.fundRaisingGoal });
        setShowGoalInput(true);
        onStepComplete?.(2);

        // Set visibleToDonor from initialData if available
        if (initialData.visibleToDonor !== undefined) {
          console.log(
            'Setting visibleToDonor from initialData:',
            initialData.visibleToDonor,
          );
          setShowFundraisingGoalInPreview(initialData.visibleToDonor);
        }
      } else {
        console.log('No goal data found in initialData');
      }

      // Step 3: Add Description
      if (initialData.description) {
        setDescriptionData({ description: initialData.description });
        setDescriptionCharCount(getTextLength(initialData.description));
        setShowDescriptionInput(true);
        onStepComplete?.(3);
      }

      // Step 4: Payment Account
      if (initialData.paymentAccountId || initialData.paymentMethods) {
        setPaymentAccountData({
          paymentAccountId: initialData.paymentAccountId || 0,
          paymentMethods: [],
        });

        if (initialData.paymentAccountId && initialData.paymentAccountId > 0) {
          fetchPaymentMethods(
            initialData.paymentAccountId,
            Array.isArray(initialData.paymentMethods)
              ? initialData.paymentMethods.map(String)
              : [],
          );
        }
      }

      // Step 5: Preset amounts initialization
      if (initialData.presetAmounts) {
        const newPresetAmounts: PresetAmountsState = {
          oneTime: defaultPresetAmounts.oneTime,
          monthly: defaultPresetAmounts.monthly,
          yearly: defaultPresetAmounts.yearly,
        };

        if (initialData.presetAmounts.oneTime) {
          setOneTimeEnabled(initialData.presetAmounts.oneTime.enabled || false);
          if (initialData.presetAmounts.oneTime.presetDetails?.length > 0) {
            newPresetAmounts.oneTime =
              initialData.presetAmounts.oneTime.presetDetails.map(
                (preset: any, index: number) => ({
                  id: index + 1,
                  amount: preset.amount?.toString() || '0.00',
                  description: preset.description || '',
                }),
              );
          }
        }

        if (initialData.presetAmounts.monthly) {
          setMonthlyEnabled(initialData.presetAmounts.monthly.enabled || false);
          if (initialData.presetAmounts.monthly.presetDetails?.length > 0) {
            newPresetAmounts.monthly =
              initialData.presetAmounts.monthly.presetDetails.map(
                (preset: any, index: number) => ({
                  id: index + 1,
                  amount: preset.amount?.toString() || '0.00',
                  description: preset.description || '',
                }),
              );
          }
        }

        if (initialData.presetAmounts.yearly) {
          setYearlyEnabled(initialData.presetAmounts.yearly.enabled || false);
          if (initialData.presetAmounts.yearly.presetDetails?.length > 0) {
            newPresetAmounts.yearly =
              initialData.presetAmounts.yearly.presetDetails.map(
                (preset: any, index: number) => ({
                  id: index + 1,
                  amount: preset.amount?.toString() || '0.00',
                  description: preset.description || '',
                }),
              );
          }
        }

        setPresetAmounts(newPresetAmounts);
      }

      // Step 6: Campaign Color
      if (initialData.selectedColor) {
        setSelectedColor(initialData.selectedColor);
      }

      // Step 7: Banner Image
      if (initialData.bannerImage) {
        setBannerId(initialData.bannerImage);
        const savedSource = localStorage.getItem(
          `campaign_${campaignId || UniqueId}_banner_source`,
        ) as 'upload' | 'ai' | null;
        setBannerSource(savedSource);

        if (savedSource === 'ai') {
          setTabIndex(1);
        } else {
          setTabIndex(0);
        }

        const fetchBannerImage = async () => {
          setIsFetchingBanner(true);
          try {
            const blobUrl = await donationService.getBannerImageBlob(
              initialData.bannerImage,
            );

            if (savedSource === 'ai') {
              const response = await fetch(blobUrl);
              const blob = await response.blob();
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result as string;
                const base64Data = base64.split(',')[1];
                setAiGeneratedImage(base64Data);
                setBannerPreview(blobUrl);
              };
              reader.readAsDataURL(blob);
            } else {
              setBannerPreview(blobUrl);
            }
          } catch (error) {
            console.error('Error fetching banner image:', error);
            setBannerPreview(initialData.bannerImage);
          } finally {
            setIsFetchingBanner(false);
          }
        };
        fetchBannerImage();
      }

      // Step 8: Email Template
      if (initialData.emailSubject || initialData.emailBody) {
        if (initialData.emailSubject) setEmailSubject(initialData.emailSubject);
        if (initialData.emailBody) setEmailBody(initialData.emailBody);
        onStepComplete?.(8);
      }

      setHasInitializedData(true);
    }
  }, [initialData, campaignId, hasInitializedData]);

  // Handle Save and Exit trigger from parent
  useEffect(() => {
    if (saveAndExitTrigger > 0) {
      const handleSaveAndExitByStep = async () => {
        setIsSavingAndExiting(true);
        try {
          // Save based on current step
          switch (step) {
            case 1:
              // For step 1, we need to validate and save basic info
              const name = createDonationData.name?.trim() || '';
              if (name && name.length >= 3) {
                await handleStep1SubmitForSaveAndExit();
              }
              break;
            case 2:
              if (showGoalInput && donationGoalState.fundRaisingGoal > 0) {
                await handleStep2SubmitForSaveAndExit();
              }
              break;
            case 3:
              if (
                descriptionData.description &&
                descriptionData.description.trim() !== ''
              ) {
                await handleStep3SubmitForSaveAndExit();
              }
              break;
            case 4:
              if (
                paymentAccountData.paymentAccountId > 0 &&
                paymentAccountData.paymentMethods.length > 0
              ) {
                await handleStep4SubmitForSaveAndExit();
              }
              break;
            case 5:
              await handleStep5SubmitForSaveAndExit();
              break;
            case 6:
              if (selectedColor) {
                await handleStep6SubmitForSaveAndExit();
              }
              break;
            case 7:
              if (bannerImage || aiGeneratedImage || bannerPreview) {
                await handleStep7SubmitForSaveAndExit();
              }
              break;
            case 8:
              await handleStep8SubmitForSaveAndExit();
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error during save and exit:', error);
        } finally {
          setIsSavingAndExiting(false);
          onSaveAndExitComplete?.();
        }
      };

      handleSaveAndExitByStep();
    }
  }, [saveAndExitTrigger]);

  // Re-fetch banner when returning to step 7
  useEffect(() => {
    const fetchBanner = async () => {
      if (step === 7 && bannerId && !bannerImage) {
        setIsFetchingBanner(true);
        try {
          const blobUrl = await donationService.getBannerImageBlob(bannerId);

          if (bannerPreview && bannerPreview.startsWith('blob:')) {
            URL.revokeObjectURL(bannerPreview);
          }

          const savedSource = localStorage.getItem(
            `campaign_${campaignId || reduxCampaignId || UniqueId}_banner_source`,
          ) as 'upload' | 'ai' | null;

          if (savedSource === 'ai') {
            setTabIndex(1);
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              const base64Data = base64.split(',')[1];
              setAiGeneratedImage(base64Data);
              setBannerPreview(blobUrl);
            };
            reader.readAsDataURL(blob);
          } else {
            setTabIndex(0);
            setBannerPreview(blobUrl);
          }
        } catch (error) {
          console.error('Error fetching banner:', error);
        } finally {
          setIsFetchingBanner(false);
        }
      }
    };
    fetchBanner();
  }, [step, bannerId]);

  // ============================================
  // HANDLER FUNCTIONS
  // ============================================

  const fetchPaymentAccounts = async () => {
    setLoadingPaymentAccounts(true);
    try {
      const response = await donationService.getPaymentAccountItems();
      if (response.success) {
        setPaymentAccountList(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load payment accounts.',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setLoadingPaymentAccounts(false);
    }
  };

  const fetchPaymentMethods = async (
    accountId: number,
    preselectedApiNames?: string[],
  ) => {
    setLoadingMethods(true);
    try {
      const response =
        await donationService.getPaymentMethodsForAccount(accountId);
      if (response.success) {
        const allMethods = response.data;
        setAvailablePaymentMethods(allMethods);

        // Pre-select methods returned by the get-payment-account API
        // API returns names like "Ach", "WalletPay" — match them against loaded method text
        if (preselectedApiNames && preselectedApiNames.length > 0) {
          const matched = allMethods
            .filter((method: { text: string; value: number }) => {
              const methodTextLower = method.text
                .toLowerCase()
                .replace(/[^a-z]/g, '');
              return preselectedApiNames.some((apiName) => {
                const apiNameLower = apiName
                  .toLowerCase()
                  .replace(/[^a-z]/g, '');
                return (
                  methodTextLower.includes(apiNameLower) ||
                  apiNameLower.includes(methodTextLower)
                );
              });
            })
            .map((method: { value: number }) => String(method.value));
          if (matched.length > 0) {
            setPaymentAccountData((prev) => ({
              ...prev,
              paymentMethods: matched,
            }));
          }
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to load payment methods.',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setLoadingMethods(false);
    }
  };

  // Step 1 Handler
  const handleStep1Submit = async () => {
    if (isSubmittingStep) return;

    let valid = true;

    const name = createDonationData.name?.trim() || '';
    if (!name) {
      valid = false;
      setNameError('Please enter a donation name');
    } else if (name.length < 3) {
      valid = false;
      setNameError('Please enter a valid donation name');
    } else {
      setNameError('');
    }

    const startDate = createDonationData.startDate
      ? new Date(createDonationData.startDate)
      : null;
    const endDate = createDonationData.endDate
      ? new Date(createDonationData.endDate)
      : null;

    if (!createDonationData.startDate || !startDate) {
      valid = false;
      setStartDateError('Start date is required');
    } else if (isNaN(startDate.getTime())) {
      valid = false;
      setStartDateError('Please enter a valid start date');
    } else if (!createDonationData.endDate || !endDate) {
      valid = false;
      setEndDateError('End date is required');
    } else if (isNaN(endDate.getTime())) {
      valid = false;
      setEndDateError('Please enter a valid end date');
    } else if (endDate <= startDate) {
      valid = false;
      setEndDateError('End date must be greater than start date');
      toast({
        title: 'Error',
        description: 'End date must be greater than start date',
        status: 'error',
        position: 'top-right',
      });
    } else {
      setStartDateError('');
      setEndDateError('');
    }

    if (valid) {
      setIsSubmittingStep(true);
      try {
        if (campaignId || reduxCampaignId || UniqueId) {
          const result = await dispatch(
            updateBasicInfo({
              campaignId: campaignId || reduxCampaignId || UniqueId,
              basicInfo: {
                ...createDonationData,
                startDate:
                  createDonationData.startDate instanceof Date
                    ? createDonationData.startDate.toISOString()
                    : createDonationData.startDate,
                endDate:
                  createDonationData.endDate instanceof Date
                    ? createDonationData.endDate.toISOString()
                    : createDonationData.endDate,
              },
            }),
          ).unwrap();

          dispatch(
            setReduxFormData({
              name: createDonationData.name,
              startDate:
                createDonationData.startDate instanceof Date
                  ? createDonationData.startDate.toISOString()
                  : createDonationData.startDate,
              endDate:
                createDonationData.endDate instanceof Date
                  ? createDonationData.endDate.toISOString()
                  : createDonationData.endDate,
            }),
          );
          dispatch(completeStep(1));
          onStepComplete?.(1);
          setStep((s) => Math.min(9, s + 1));

          toast({
            title: 'Success',
            description: 'Campaign basic information updated successfully',
            status: 'success',
            position: 'top-right',
          });
        } else {
          const result = await dispatch(
            createCampaign({
              ...createDonationData,
              startDate:
                createDonationData.startDate instanceof Date
                  ? createDonationData.startDate.toISOString()
                  : createDonationData.startDate,
              endDate:
                createDonationData.endDate instanceof Date
                  ? createDonationData.endDate.toISOString()
                  : createDonationData.endDate,
            }),
          ).unwrap();

          dispatch(
            setReduxFormData({
              name: createDonationData.name,
              startDate:
                createDonationData.startDate instanceof Date
                  ? createDonationData.startDate.toISOString()
                  : createDonationData.startDate,
              endDate:
                createDonationData.endDate instanceof Date
                  ? createDonationData.endDate.toISOString()
                  : createDonationData.endDate,
            }),
          );
          dispatch(setCampaignId(result.data));
          dispatch(completeStep(1));
          setUniqueId(result.data);
          onStepComplete?.(1);
          setStep((s) => Math.min(9, s + 1));

          toast({
            title: 'Success',
            description: 'Campaign created successfully',
            status: 'success',
            position: 'top-right',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error?.message || CommonMethod.ErrorMessage(error),
          status: 'error',
          position: 'top-right',
        });
      } finally {
        setIsSubmittingStep(false);
      }
    }
  };

  // Step 2 Handler
  const handleStep2Submit = async () => {
    if (isSubmittingStep) return;

    if (!UniqueId?.trim()) {
      toast({
        title: 'Error',
        description: 'Unique ID not found. Please complete Step 1 first.',
        status: 'error',
        position: 'top-right',
      });
      setFundGoalError('Unique ID not found. Please complete Step 1 first.');
      return;
    }

    const goal = Number(donationGoalState.fundRaisingGoal);
    if (!goal || isNaN(goal) || goal <= 0) {
      toast({
        title: 'Error',
        description: 'Invalid Fund Raising Goal',
        status: 'error',
        position: 'top-right',
      });
      setFundGoalError('Invalid Fund Raising Goal');
      return;
    }

    setIsSubmittingStep(true);
    try {
      const payload = {
        amount: goal,
        visibleToDonor: showFundraisingGoalInPreview,
      };

      const response = await donationService.setGoal(UniqueId, payload, step);

      if (response?.success) {
        toast({
          title: 'Goal Set Successfully',
          description: 'The fundraising goal has been saved for this campaign.',
          status: 'success',
          position: 'top-right',
        });
        onStepComplete?.(2);
        setStep((s) => Math.min(9, s + 1));
      } else {
        toast({
          title: 'Error',
          description: response?.message || 'Failed to set goal.',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmittingStep(false);
    }
  };

  // Step 3 Handler
  const handleStep3Submit = async () => {
    if (isSubmittingStep) return;

    if (!UniqueId || UniqueId.trim() === '') {
      toast({
        title: 'Error',
        description: 'Unique ID not found. Please complete Step 1 first.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    if (
      !descriptionData.description ||
      descriptionData.description.trim() === ''
    ) {
      setStep((s) => Math.min(9, s + 1));
      return;
    }

    const textLength = getTextLength(descriptionData.description);
    if (textLength > DESCRIPTION_MAX_LENGTH) {
      toast({
        title: 'Description Too Long',
        description: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less.`,
        status: 'error',
        position: 'top-right',
        duration: 5000,
      });
      return;
    }

    setIsSubmittingStep(true);
    try {
      const response = await donationService.setDescription(
        UniqueId,
        descriptionData,
        step,
      );

      if (response?.success) {
        toast({
          title: 'Description Saved',
          description: 'The campaign description has been added successfully.',
          status: 'success',
          position: 'top-right',
        });
        onStepComplete?.(3);
        setStep((s) => Math.min(9, s + 1));
      } else {
        toast({
          title: 'Error',
          description: response?.message || 'Failed to set description.',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmittingStep(false);
    }
  };

  // Step 4 Handler
  const handleStep4Submit = async () => {
    if (isSubmittingStep) return;

    let valid = true;

    if (!UniqueId || UniqueId.trim() === '') {
      toast({
        title: 'Error',
        description: 'Unique ID not found. Please complete previous steps.',
        status: 'error',
        position: 'top-right',
      });
      valid = false;
    }

    if (
      !paymentAccountData.paymentAccountId ||
      paymentAccountData.paymentAccountId === 0
    ) {
      toast({
        title: 'Error',
        description: 'Please select a payment account.',
        status: 'error',
        position: 'top-right',
      });
      valid = false;
    }

    if (paymentAccountData.paymentMethods.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one payment method.',
        status: 'error',
        position: 'top-right',
      });
      valid = false;
    }

    if (!valid) return;

    setIsSubmittingStep(true);
    try {
      const response = await donationService.setPaymentAccount(
        UniqueId,
        paymentAccountData,
        step,
      );

      if (response?.success) {
        toast({
          title: 'Payment Account Set',
          description: 'Payment account configuration saved successfully.',
          status: 'success',
          position: 'top-right',
        });
        onStepComplete?.(4);
        setStep((s) => Math.min(9, s + 1));
      } else {
        toast({
          title: 'Error',
          description: response?.message || 'Failed to set payment account.',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmittingStep(false);
    }
  };

  // Step 5 Handler
  const handleStep5Submit = async () => {
    if (isSubmittingStep) return;

    setIsSubmittingStep(true);
    try {
      const payload = {
        OneTime: {
          enabled: oneTimeEnabled,
          presetDetails: oneTimeEnabled
            ? presetAmounts.oneTime.map((preset) => ({
                amount: parseFloat(preset.amount),
                description: preset.description,
              }))
            : [],
        },
        Monthly: {
          enabled: monthlyEnabled,
          presetDetails: monthlyEnabled
            ? presetAmounts.monthly.map((preset) => ({
                amount: parseFloat(preset.amount),
                description: preset.description,
              }))
            : [],
        },
        Yearly: {
          enabled: yearlyEnabled,
          presetDetails: yearlyEnabled
            ? presetAmounts.yearly.map((preset) => ({
                amount: parseFloat(preset.amount),
                description: preset.description,
              }))
            : [],
        },
      };

      await donationService.setPresets(UniqueId, payload, step);
      onStepComplete?.(5);
      setStep((s) => Math.min(9, s + 1));
    } catch (error) {
      console.error('Error saving preset donations:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preset donations. Please try again.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmittingStep(false);
    }
  };

  // Step 6 Handler
  const handleStep6Submit = async () => {
    if (isSubmittingStep) return;

    if (!UniqueId?.trim()) {
      toast({
        title: 'Error',
        description: 'Unique ID not found. Please complete previous steps.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    if (!selectedColor) {
      toast({
        title: 'Error',
        description: 'Please select a campaign theme.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    setIsSubmittingStep(true);
    try {
      const response = await donationService.setCampaignThemeColor(
        UniqueId,
        selectedColor,
        step,
      );

      if (response?.success) {
        toast({
          title: 'Theme Saved',
          description: 'Campaign theme has been set successfully.',
          status: 'success',
          position: 'top-right',
        });
        onStepComplete?.(6);
        setStep((s) => Math.min(9, s + 1));
      } else {
        toast({
          title: 'Error',
          description: response?.message || 'Failed to set campaign theme.',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmittingStep(false);
    }
  };

  // Step 7 Handler
  const handleStep7Submit = async () => {
    if (isSubmittingStep || isUploadingBanner) return;

    if (!UniqueId?.trim()) {
      toast({
        title: 'Error',
        description: 'Unique ID not found. Please complete previous steps.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    if (!bannerImage && !aiGeneratedImage && !bannerPreview) {
      toast({
        title: 'Error',
        description: 'Please upload an image for the banner.',
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    setIsSubmittingStep(true);
    setIsUploadingBanner(true);

    try {
      const formDataObj = new FormData();
      let file: File | null = null;
      let currentBannerSource: 'upload' | 'ai' | null = null;

      if (aiGeneratedImage && !bannerImage) {
        currentBannerSource = 'ai';
        const base64WithPrefix = aiGeneratedImage.startsWith('data:')
          ? aiGeneratedImage
          : `data:image/png;base64,${aiGeneratedImage}`;
        file = helpers.base64ToFile(base64WithPrefix, `${aiPrompt.trim()}.png`);
      } else if (bannerImage) {
        currentBannerSource = 'upload';
        file = bannerImage;
      } else if (bannerPreview && bannerId) {
        try {
          const response = await fetch(bannerPreview);
          const blob = await response.blob();
          file = new File([blob], `${bannerId}.png`, { type: 'image/png' });
        } catch (error) {
          console.error('Error fetching existing banner for re-upload:', error);
          setIsSubmittingStep(false);
          setIsUploadingBanner(false);
          setStep((s) => Math.min(9, s + 1));
          return;
        }
      }

      formDataObj.append('banner', file);

      const response = await donationService.setBanner(
        UniqueId,
        formDataObj,
        step,
      );

      if (response?.success) {
        if (currentBannerSource) {
          setBannerSource(currentBannerSource);
          localStorage.setItem(
            `campaign_${UniqueId}_banner_source`,
            currentBannerSource,
          );
        }

        toast({
          title: 'Banner Uploaded',
          description: 'The banner image has been uploaded successfully.',
          status: 'success',
          position: 'top-right',
        });
        onStepComplete?.(7);
        setStep((s) => Math.min(9, s + 1));
      } else {
        toast({
          title: 'Error',
          description: response?.message || 'Failed to upload banner.',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload banner';

      toast({
        title: 'Upload Error',
        description: errorMessage,
        status: 'error',
        position: 'top-right',
        duration: 5000,
      });
    } finally {
      setIsSubmittingStep(false);
      setIsUploadingBanner(false);
    }
  };

  // Step 8 Handler
  const handleStep8Submit = async () => {
    if (isSubmittingStep) return;

    setIsSubmittingStep(true);
    try {
      const emailTemplateData = {
        emailSubject: emailSubject,
        emailBody: emailBody,
        notifyOrganizerOnDonation: true,
      };

      await donationService.setEmailTemplate(UniqueId, emailTemplateData, step);

      onStepComplete?.(8);
      setStep((s) => Math.min(9, s + 1));
    } catch (error) {
      console.error('Error saving email template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email template.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmittingStep(false);
    }
  };

  // Step 9 Handler
  const handlePublishCampaign = async () => {
    const isAlreadyPublished = campaignData?.publishDate !== null;
    if (isSubmittingStep || isAlreadyPublished) return;

    setIsSubmittingStep(true);
    try {
      const response = await donationService.publishCampaign(UniqueId);

      if (response) {
        setCampaignData((prev) =>
          prev
            ? {
                ...prev,
                publishDate: new Date().toISOString(),
                campaignStatus: 'Published',
              }
            : null,
        );

        onOpen();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    } catch (error) {
      console.error('Error publishing campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish campaign.',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmittingStep(false);
    }
  };

  // Save and Exit handlers (save without advancing step)
  const handleStep1SubmitForSaveAndExit = async () => {
    if (campaignId || reduxCampaignId || UniqueId) {
      await dispatch(
        updateBasicInfo({
          campaignId: campaignId || reduxCampaignId || UniqueId,
          basicInfo: {
            ...createDonationData,
            startDate:
              createDonationData.startDate instanceof Date
                ? createDonationData.startDate.toISOString()
                : createDonationData.startDate,
            endDate:
              createDonationData.endDate instanceof Date
                ? createDonationData.endDate.toISOString()
                : createDonationData.endDate,
          },
        }),
      ).unwrap();
    } else {
      const result = await dispatch(
        createCampaign({
          ...createDonationData,
          startDate:
            createDonationData.startDate instanceof Date
              ? createDonationData.startDate.toISOString()
              : createDonationData.startDate,
          endDate:
            createDonationData.endDate instanceof Date
              ? createDonationData.endDate.toISOString()
              : createDonationData.endDate,
        }),
      ).unwrap();
      setUniqueId(result.data);
    }
  };

  const handleStep2SubmitForSaveAndExit = async () => {
    if (!UniqueId?.trim()) return;
    const goal = Number(donationGoalState.fundRaisingGoal);
    if (!goal || isNaN(goal) || goal <= 0) return;
    await donationService.setGoal(
      UniqueId,
      { amount: goal, visibleToDonor: showFundraisingGoalInPreview },
      step,
    );
  };

  const handleStep3SubmitForSaveAndExit = async () => {
    if (!UniqueId?.trim()) return;
    await donationService.setDescription(UniqueId, descriptionData, step);
  };

  const handleStep4SubmitForSaveAndExit = async () => {
    if (!UniqueId?.trim()) return;
    await donationService.setPaymentAccount(UniqueId, paymentAccountData, step);
  };

  const handleStep5SubmitForSaveAndExit = async () => {
    if (!UniqueId?.trim()) return;
    const payload = {
      OneTime: {
        enabled: oneTimeEnabled,
        presetDetails: oneTimeEnabled
          ? presetAmounts.oneTime.map((preset) => ({
              amount: parseFloat(preset.amount),
              description: preset.description,
            }))
          : [],
      },
      Monthly: {
        enabled: monthlyEnabled,
        presetDetails: monthlyEnabled
          ? presetAmounts.monthly.map((preset) => ({
              amount: parseFloat(preset.amount),
              description: preset.description,
            }))
          : [],
      },
      Yearly: {
        enabled: yearlyEnabled,
        presetDetails: yearlyEnabled
          ? presetAmounts.yearly.map((preset) => ({
              amount: parseFloat(preset.amount),
              description: preset.description,
            }))
          : [],
      },
    };
    await donationService.setPresets(UniqueId, payload, step);
  };

  const handleStep6SubmitForSaveAndExit = async () => {
    if (!UniqueId?.trim() || !selectedColor) return;
    await donationService.setCampaignThemeColor(UniqueId, selectedColor, step);
  };

  const handleStep7SubmitForSaveAndExit = async () => {
    if (!UniqueId?.trim()) return;
    if (!bannerImage && !aiGeneratedImage && !bannerPreview) return;

    const formDataObj = new FormData();
    let file: File | null = null;

    if (aiGeneratedImage && !bannerImage) {
      const base64WithPrefix = aiGeneratedImage.startsWith('data:')
        ? aiGeneratedImage
        : `data:image/png;base64,${aiGeneratedImage}`;
      file = helpers.base64ToFile(base64WithPrefix, `${aiPrompt.trim()}.png`);
    } else if (bannerImage) {
      file = bannerImage;
    } else if (bannerPreview && bannerId) {
      const response = await fetch(bannerPreview);
      const blob = await response.blob();
      file = new File([blob], `${bannerId}.png`, { type: 'image/png' });
    }

    if (file) {
      formDataObj.append('banner', file);
      await donationService.setBanner(UniqueId, formDataObj, step);
    }
  };

  const handleStep8SubmitForSaveAndExit = async () => {
    if (!UniqueId?.trim()) return;
    const emailTemplateData = {
      emailSubject: emailSubject,
      emailBody: emailBody,
      notifyOrganizerOnDonation: true,
    };
    await donationService.setEmailTemplate(UniqueId, emailTemplateData, step);
  };

  // Handler for Save & Exit button in steps
  const handleSaveAndExit = () => {
    setIsSavingAndExiting(true);
    const handleSave = async () => {
      try {
        switch (step) {
          case 1:
            const name = createDonationData.name?.trim() || '';
            if (name && name.length >= 3) {
              await handleStep1SubmitForSaveAndExit();
            }
            break;
          case 2:
            if (showGoalInput && donationGoalState.fundRaisingGoal > 0) {
              await handleStep2SubmitForSaveAndExit();
            }
            break;
          case 3:
            if (
              descriptionData.description &&
              descriptionData.description.trim() !== ''
            ) {
              await handleStep3SubmitForSaveAndExit();
            }
            break;
          case 4:
            if (
              paymentAccountData.paymentAccountId > 0 &&
              paymentAccountData.paymentMethods.length > 0
            ) {
              await handleStep4SubmitForSaveAndExit();
            }
            break;
          case 5:
            await handleStep5SubmitForSaveAndExit();
            break;
          case 6:
            if (selectedColor) {
              await handleStep6SubmitForSaveAndExit();
            }
            break;
          case 7:
            if (bannerImage || aiGeneratedImage || bannerPreview) {
              await handleStep7SubmitForSaveAndExit();
            }
            break;
          case 8:
            await handleStep8SubmitForSaveAndExit();
            break;
          default:
            break;
        }
        toast({
          title: 'Saved',
          description: 'Your progress has been saved.',
          status: 'success',
          position: 'top-right',
        });
      } catch (error) {
        console.error('Error during save and exit:', error);
        toast({
          title: 'Error',
          description: 'Failed to save. Please try again.',
          status: 'error',
          position: 'top-right',
        });
      } finally {
        setIsSavingAndExiting(false);
        navigate('/organizer/donation/manage-donation-module');
      }
    };
    handleSave();
  };

  // Navigation handlers
  const skipStep = () => setStep((s) => Math.min(9, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));
  const backToList = () =>
    navigate('/organizer/donation/manage-donation-module');

  const handleClose = () => {
    setShowConfetti(false);
    onClose();
  };

  // Form change handlers
  const handleNameChange = (name: string) => {
    setCreateDonationData((prev) => ({ ...prev, name }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const iso = value ? new Date(value).toISOString() : '';
    const dateValue = value ? new Date(value) : new Date();
    setFormData((f) => ({ ...f, [name]: iso }));
    setCreateDonationData((prev) => ({
      ...prev,
      [name]: dateValue,
    }));
  };

  const handlePresetAmountChange = (
    type: string,
    id: number,
    newAmount: string,
  ) => {
    setPresetAmounts((prev) => ({
      ...prev,
      [type]: prev[type as keyof PresetAmountsState].map((preset) =>
        preset.id === id ? { ...preset, amount: newAmount } : preset,
      ),
    }));
  };

  const handlePresetDescriptionChange = (
    type: string,
    id: number,
    newDescription: string,
  ) => {
    setPresetAmounts((prev) => ({
      ...prev,
      [type]: prev[type as keyof PresetAmountsState].map((preset) =>
        preset.id === id ? { ...preset, description: newDescription } : preset,
      ),
    }));
  };

  const handlePresetToggleChange = (
    type: 'oneTime' | 'monthly' | 'yearly',
    enabled: boolean,
  ) => {
    switch (type) {
      case 'oneTime':
        setOneTimeEnabled(enabled);
        break;
      case 'monthly':
        setMonthlyEnabled(enabled);
        break;
      case 'yearly':
        setYearlyEnabled(enabled);
        break;
    }
  };

  const handlePaymentAccountChange = async (accountId: number) => {
    if (accountId > 0) {
      await fetchPaymentMethods(accountId);
      setPaymentAccountData({
        ...paymentAccountData,
        paymentAccountId: accountId,
        paymentMethods: [],
      });
    } else {
      setPaymentAccountData({
        ...paymentAccountData,
        paymentAccountId: accountId,
        paymentMethods: [],
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const isAlreadyPublished = campaignData?.publishDate !== null;

  return (
    <Box maxW="100%" h="100%">
      {/* Step 1 - Basic Information */}
      {step === 1 && (
        <Step1BasicInfo
          campaignData={createDonationData}
          formData={formData}
          nameError={nameError}
          startDateError={startDateError}
          endDateError={endDateError}
          onNameChange={handleNameChange}
          onDateChange={handleDateChange}
          onSaveAndNext={handleStep1Submit}
          onBackToList={backToList}
          isSubmitting={isSubmittingStep}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 2 - Set Goal */}
      {step === 2 && (
        <Step2SetGoal
          donationGoal={donationGoalState}
          showGoalInput={showGoalInput}
          showFundraisingGoalInPreview={showFundraisingGoalInPreview}
          goalError={FundGoalError}
          onGoalChange={(goal) =>
            setDonationGoalState({ fundRaisingGoal: goal })
          }
          onShowGoalInputChange={setShowGoalInput}
          onShowInPreviewChange={setShowFundraisingGoalInPreview}
          onSaveAndNext={handleStep2Submit}
          onSkip={skipStep}
          onPrevStep={prevStep}
          isSubmitting={isSubmittingStep}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 3 - Add Description */}
      {step === 3 && (
        <Step3Description
          description={descriptionData.description}
          descriptionCharCount={descriptionCharCount}
          maxLength={DESCRIPTION_MAX_LENGTH}
          descriptionError={descriptionError}
          onDescriptionChange={(description, charCount) => {
            setDescriptionData({ description });
            setDescriptionCharCount(charCount);
          }}
          onSaveAndNext={handleStep3Submit}
          onSkip={skipStep}
          onPrevStep={prevStep}
          isSubmitting={isSubmittingStep}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 4 - Set Payment Account */}
      {step === 4 && (
        <Step4PaymentAccount
          paymentAccountData={paymentAccountData}
          paymentAccountList={paymentAccountList}
          availablePaymentMethods={availablePaymentMethods}
          loadingAccounts={loadingPaymentAccounts}
          loadingMethods={loadingMethods}
          onAccountChange={handlePaymentAccountChange}
          onMethodsChange={(methods) =>
            setPaymentAccountData({
              ...paymentAccountData,
              paymentMethods: methods,
            })
          }
          onSaveAndNext={handleStep4Submit}
          onPrevStep={prevStep}
          isSubmitting={isSubmittingStep}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 5 - Preset Donations */}
      {step === 5 && (
        <Step5PresetDonations
          presetAmounts={presetAmounts}
          oneTimeEnabled={oneTimeEnabled}
          monthlyEnabled={monthlyEnabled}
          yearlyEnabled={yearlyEnabled}
          onAmountChange={handlePresetAmountChange}
          onDescriptionChange={handlePresetDescriptionChange}
          onToggleChange={handlePresetToggleChange}
          onSaveAndNext={handleStep5Submit}
          onSkip={skipStep}
          onPrevStep={prevStep}
          isSubmitting={isSubmittingStep}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 6 - Campaign Color */}
      {step === 6 && (
        <Step6CampaignColor
          selectedColor={selectedColor}
          availableColors={availableColors}
          onColorChange={setSelectedColor}
          onSaveAndNext={handleStep6Submit}
          onSkip={skipStep}
          onPrevStep={prevStep}
          isSubmitting={isSubmittingStep}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 7 - Select Banner */}
      {step === 7 && (
        <Step7BannerUpload
          bannerImage={bannerImage}
          setBannerImage={setBannerImage}
          bannerPreview={bannerPreview}
          setBannerPreview={setBannerPreview}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          isGeneratingImage={isGeneratingImage}
          setIsGeneratingImage={setIsGeneratingImage}
          aiGeneratedImage={aiGeneratedImage}
          setAiGeneratedImage={setAiGeneratedImage}
          tabIndex={tabIndex}
          setTabIndex={setTabIndex}
          campaignId={campaignId || reduxCampaignId || UniqueId}
          bannerId={bannerId}
          onBannerRemoved={() => setBannerId(null)}
          isFetchingBanner={isFetchingBanner}
          onPrevStep={prevStep}
          onSkip={skipStep}
          onSaveAndNext={handleStep7Submit}
          isSubmitting={isSubmittingStep}
          isUploadingBanner={isUploadingBanner}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 8 - Thank You Email */}
      {step === 8 && (
        <Step8ThankYouEmail
          emailSubject={emailSubject}
          emailBody={emailBody}
          campaignName={createDonationData.name}
          setEmailSubject={setEmailSubject}
          setEmailBody={setEmailBody}
          onPrevStep={prevStep}
          onSkip={skipStep}
          onSaveAndNext={handleStep8Submit}
          isSubmitting={isSubmittingStep}
          onSaveAndExit={handleSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
        />
      )}

      {/* Step 9 - Review & Confirm */}
      {step === 9 && (
        <>
          <Step9ReviewConfirm
            campaignData={campaignData}
            isLoading={isCheckingStatus}
            isAlreadyPublished={isAlreadyPublished}
            onPublish={handlePublishCampaign}
            onPrevStep={prevStep}
            onBackToList={backToList}
            isSubmitting={isSubmittingStep}
          />
          <CampaignSuccessModal
            isOpen={isOpen}
            onClose={handleClose}
            showConfetti={showConfetti}
          />
        </>
      )}
    </Box>
  );
}
