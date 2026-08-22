import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  useToast,
  Flex,
  Heading,
  IconButton,
  Grid,
  SlideFade,
  useDisclosure,
  Image,
  Text,
  Skeleton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Stack,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ContactInfo,
  PaymentMethodDetail,
  DonationFormData,
} from '../../../interface/donationInter/donationFormDto';
import donationService, {
  DonationSubmitRequest,
  StripeCredentials,
} from '../../../service/organizer/donation/donationService';
import Loader from '../../common/Loader';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchCampaignForDonation,
  submitDonation,
} from '../../../../store/slices/donationSlice';
import DonationSuccessModal from './organizerDonationComponents/DonationSuccessModal';
import DonationFailureModal from './organizerDonationComponents/DonationFailureModal';
import DonationProgressIndicator from './organizerDonationComponents/DonationProgressIndicator';
import CampaignDetails from './organizerDonationComponents/CampaignDetails';
import FundraiseForThisButton from './peerToPeer/join/FundraiseForThisButton';
import DonationAmountSelector from './organizerDonationComponents/DonationAmountSelector';
import DonationStep2Content from './organizerDonationComponents/DonationStep2Content';
import StripeProvider, { getStripeInstance } from '../../common/StripeProvider';
import Turnstile from '../../common/Turnstile';
import creditcardIcon from '../../../../assets/img/organizer/donation/Paymentcard.svg';
import googlePayIcon from '../../../../assets/img/organizer/donation/Googlepay.svg';
import applePayIcon from '../../../../assets/img/organizer/donation/Apple pay.svg';
import { AchPaymentDetail } from '../settings/payment/achMethodForm';
import { useStripe } from '@stripe/react-stripe-js';
import PAD_icon from '../../../../assets/img/organizer/donation/PAD-icon.svg';
import ACH_icon from '../../../../assets/img/organizer/donation/ACH-icon.svg';
import { PadPaymentDetail } from '../settings/payment/PadPaymentForm';
import { ChequePaymentDetail } from '../settings/payment/ChequePaymentForm';
import PaymentAccountService from '../../../service/organizer/donation/paymentAccountService';
import paymentAccountService from '../../../service/organizer/donation/paymentAccountService';
const TURNSTILE_SITE_KEY = '0x4AAAAAACVCN7LaNG3PT6At';

export default function DonateToCampaign() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const dispatch = useAppDispatch();
  const {
    isOpen: isSuccessModalOpen,
    onOpen: onSuccessModalOpen,
    onClose: onSuccessModalClose,
  } = useDisclosure();
  const {
    isOpen: isFailureModalOpen,
    onOpen: onFailureModalOpen,
    onClose: onFailureModalClose,
  } = useDisclosure();
  const {
    isOpen: isConfirmDialogOpen,
    onOpen: onConfirmDialogOpen,
    onClose: onConfirmDialogClose,
  } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Redux state
  const { currentCampaignForDonation, loading, error, successMessage } =
    useAppSelector((state) => state.donation);

  // Local state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [bannerImageUrl, setBannerImageUrl] = useState<string>('');
  const [isBannerLoading, setIsBannerLoading] = useState<boolean>(true);
  const [selectedFrequency, setSelectedFrequency] = useState<
    'OneTime' | 'Monthly' | 'Yearly'
  >('OneTime');
  const [tabIndex, setTabIndex] = useState(0);
  const [presets, setPresets] = useState<any>(null);
  const [isLoadingPresets, setIsLoadingPresets] = useState<boolean>(true);
  const [failureErrorMessage, setFailureErrorMessage] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // Stripe credentials state
  const [stripeCredentials, setStripeCredentials] =
    useState<StripeCredentials | null>(null);
  const [isLoadingStripeCredentials, setIsLoadingStripeCredentials] =
    useState<boolean>(false);
  const [stripeReady, setStripeReady] = useState<boolean>(false);

  // Ref to hold the createPaymentMethod function from PaymentMethodForm
  const createPaymentMethodRef = useRef<
    ((cardHolderName: string) => Promise<any>) | null
  >(null);
  const stripeInstanceRef = useRef<any>(null);

  // Ref to hold ACH stripe actions from inside StripeProvider
  const achActionsRef = useRef<{
    collect: (clientSecret: string, formData: any) => Promise<any>;
    confirm: (clientSecret: string, paymentMethodId: string) => Promise<any>;
  } | null>(null);

  const [padDetail, setPadDetail] = useState<PadPaymentDetail>({
    institutionNumber: '',
    transitNumber: '',
    accountNumber: '',
  });

  const [chequeDetail, setChequeDetail] = useState<ChequePaymentDetail>({
    chequeNumber: '',
    description: '',
  });
  // Ref to hold the Google/Apple Pay show() trigger
  const paymentRequestShowRef = useRef<(() => void) | null>(null);
  const [googleApplePayMethodId, setGoogleApplePayMethodId] =
    useState<string>('');
  const [googleApplePayIntentId, setGoogleApplePayIntentId] =
    useState<string>('');

  const [achDetail, setAchDetail] = useState<AchPaymentDetail>({
    routingNumber: '',
    accountNumber: '',
    accountHolderType: 'individual',
    accountType: 'checking',
  });

  const handleAchDetailChange = (
    field: keyof AchPaymentDetail,
    value: string,
  ) => {
    setAchDetail((prev) => ({ ...prev, [field]: value }));
  };

  const [formData, setFormData] = useState<DonationFormData>({
    donationAmount: '',
    frequency: 'OneTime',
    tipDescription: 'Tip',
    tipAmount: '',
    paymentMethod: 'CreditCard',
    paymentMethodDetail: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardHolderName: '',
    },
    contact: {
      firstName: '',
      middleName: '',
      lastName: '',
      primaryEmail: '',
      cellPhone: '',
      gender: '',
      maritalStatus: '',
      dob: '',
    },
    notes: '',
  });

  // Fetch campaign data on component mount using Redux
  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId) {
        toast({
          title: 'Error',
          description: 'Campaign ID not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate(-1);
        return;
      }

      try {
        // Fetch campaign details via Redux
        await dispatch(fetchCampaignForDonation(campaignId)).unwrap();
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err?.message || 'Failed to load campaign details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate(-1);
      }
    };

    fetchData();
  }, [campaignId, dispatch, navigate, toast]);

  // Load banner image when campaign data is available
  useEffect(() => {
    const loadBanner = async () => {
      if (
        currentCampaignForDonation &&
        currentCampaignForDonation.banners &&
        currentCampaignForDonation.banners.length > 0
      ) {
        try {
          setIsBannerLoading(true);
          const bannerId = currentCampaignForDonation.banners[0];
          console.log('Banner ID from API:', bannerId);

          // Fetch the actual image blob using the banner ID
          const blobUrl = await donationService.getBannerImageBlob(bannerId);
          console.log('✅ Banner blob URL created:', blobUrl);
          setBannerImageUrl(blobUrl);
          setIsBannerLoading(false);
        } catch (bannerError) {
          console.error('❌ Error loading banner image:', bannerError);
          // Keep default banner image if fetch fails
          setBannerImageUrl('/donation.jpg');
          setIsBannerLoading(false);
        }
      } else {
        console.log('No banners found in campaign data');
        // No banner available, use default
        setBannerImageUrl('/donation.jpg');
        setIsBannerLoading(false);
      }
    };

    loadBanner();
  }, [currentCampaignForDonation]);

  // Load presets from campaign data (no separate API call needed)
  useEffect(() => {
    if (currentCampaignForDonation?.presetSettings) {
      // Convert presetSettings from public API to the format expected by the component
      const convertedPresets = {
        oneTime: {
          enabled:
            currentCampaignForDonation.presetSettings['one Time']?.length > 0,
          presetDetails:
            currentCampaignForDonation.presetSettings['one Time'] || [],
        },
        monthly: {
          enabled:
            currentCampaignForDonation.presetSettings['monthly']?.length > 0,
          presetDetails:
            currentCampaignForDonation.presetSettings['monthly'] || [],
        },
        yearly: {
          enabled:
            currentCampaignForDonation.presetSettings['yearly']?.length > 0,
          presetDetails:
            currentCampaignForDonation.presetSettings['yearly'] || [],
        },
      };
      console.log('Loaded presets from campaign data:', convertedPresets);
      setPresets(convertedPresets);
      setIsLoadingPresets(false);
    } else {
      setPresets(null);
      setIsLoadingPresets(false);
    }
  }, [currentCampaignForDonation]);

  // Fetch Stripe credentials when campaign data is available
  useEffect(() => {
    const fetchStripeCredentials = async () => {
      if (currentCampaignForDonation?.paymentAccountId) {
        setIsLoadingStripeCredentials(true);
        try {
          console.log(
            'Fetching Stripe credentials for payment account:',
            currentCampaignForDonation.paymentAccountId,
          );
          const credentials = await donationService.fetchStripeCredentials(
            currentCampaignForDonation.paymentAccountId,
          );
          console.log('Stripe credentials fetched:', credentials);
          setStripeCredentials(credentials);
        } catch (error) {
          console.error('Failed to fetch Stripe credentials:', error);
          toast({
            title: 'Payment Setup Error',
            description:
              'Unable to initialize payment system. Please try again later.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsLoadingStripeCredentials(false);
        }
      }
    };

    fetchStripeCredentials();
  }, [currentCampaignForDonation?.paymentAccountId, toast]);

  const handleInputChange = useCallback(
    (field: keyof DonationFormData, value: any) => {
      console.log(`Setting ${field} to:`, value);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleContactChange = useCallback(
    (field: keyof ContactInfo, value: string | number) => {
      setFormData((prev) => ({
        ...prev,
        contact: {
          ...prev.contact,
          [field]: value,
        },
      }));
    },
    [],
  );

  const handleTipChange = useCallback(
    (tipAmount: string, tipDescription: string, total: string) => {
      console.log(
        `Setting tip: ${tipAmount}, description: ${tipDescription}, total: ${total}`,
      );
      setFormData((prev) => ({
        ...prev,
        tipAmount: tipAmount,
        tipDescription: tipDescription,
      }));
      setTotalAmount(total); // Store the total amount
    },
    [],
  );

  const handlePaymentDetailChange = useCallback(
    (field: keyof PaymentMethodDetail, value: string) => {
      setFormData((prev) => ({
        ...prev,
        paymentMethodDetail: {
          ...prev.paymentMethodDetail,
          [field]: value,
        },
      }));
    },
    [],
  );

  const handleNextStep = () => {
    // Validate Step 1: Donation Amount
    if (!formData.donationAmount || formData.donationAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid donation amount.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCurrentStep(2);
  };

  // Check if selected payment method requires card details
  const requiresCardDetails = (value: string): boolean => {
    // Always show the payment method form when a payment method is selected
    return !!value;
  };

  const handleSubmit = () => {
    if (!formData.donationAmount || formData.donationAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid donation amount.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.paymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Google/Apple Pay: run all validations then trigger native pay sheet
    if (formData.paymentMethod === 'google_apple_pay') {
      if (!validateContactNames()) return;
      if (!validateEmail()) return;
      if (!validatePhone()) return;
      if (!turnstileToken) {
        toast({
          title: 'Verification Required',
          description: 'Please complete the security verification.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      // MUST be called synchronously from the click handler
      paymentRequestShowRef.current?.();
      return;
    }

    // Credit Card validation
    if (formData.paymentMethod === 'CreditCard') {
      if (!formData.paymentMethodDetail.cardHolderName?.trim()) {
        toast({
          title: 'Card Holder Name Required',
          description: 'Please enter the name on the card.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!stripeReady) {
        toast({
          title: 'Card Details Incomplete',
          description: 'Please complete all card fields.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    // ACH validation
    const selectedMethodText = availablePaymentMethods.find(
      (m) => m.value === formData.paymentMethod,
    )?.text;

    // 3. Inside handleSubmit(), add PAD validation after the ACH block:
    const isPad = selectedMethodText === 'PAD-CAD';

    if (isPad) {
      if (
        !padDetail.institutionNumber ||
        padDetail.institutionNumber.length !== 3
      ) {
        toast({
          title: 'Invalid Institution Number',
          description: 'Please enter a valid 3-digit institution number.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!padDetail.transitNumber || padDetail.transitNumber.length !== 5) {
        toast({
          title: 'Invalid Transit Number',
          description: 'Please enter a valid 5-digit transit number.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!padDetail.accountNumber || padDetail.accountNumber.length < 4) {
        toast({
          title: 'Invalid Account Number',
          description: 'Please enter a valid account number.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const isAch = selectedMethodText === 'ACH-USD';

    if (isAch) {
      if (!achDetail.routingNumber || achDetail.routingNumber.length !== 9) {
        toast({
          title: 'Invalid Routing Number',
          description: 'Please enter a valid 9-digit routing number.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!achDetail.accountNumber || achDetail.accountNumber.length < 4) {
        toast({
          title: 'Invalid Account Number',
          description: 'Please enter a valid account number.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const isCheque = formData.paymentMethod === 'Cheque';

    if (isCheque) {
      if (!chequeDetail.chequeNumber?.trim()) {
        toast({
          title: 'Cheque Number Required',
          description: 'Please enter the cheque number.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    onConfirmDialogOpen();
  };
  const validateContactNames = () => {
    const { firstName, middleName, lastName } = formData.contact;
    const nameRegex = /^[A-Za-z\s]{2,20}$/;

    const errorMessages: string[] = [];

    if (!firstName?.trim() || !nameRegex.test(firstName.trim())) {
      errorMessages.push('First name');
    }

    if (middleName?.trim() && !nameRegex.test(middleName.trim())) {
      errorMessages.push('Middle name');
    }

    if (!lastName?.trim() || !nameRegex.test(lastName.trim())) {
      errorMessages.push('Last name');
    }

    if (errorMessages.length > 0) {
      toast({
        title: 'Invalid Contact Information',
        description: errorMessages.join(' and '),
        status: 'error',
        position: 'bottom',
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const validateEmail = () => {
    const { primaryEmail } = formData.contact;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!primaryEmail?.trim()) {
      toast({
        title: 'Invalid Contact Information',
        description: 'Email is required',
        status: 'error',
        position: 'bottom',
        isClosable: true,
      });
      return false;
    }

    if (!emailRegex.test(primaryEmail.trim())) {
      toast({
        title: 'Invalid Contact Information',
        description: 'Please enter a valid email address',
        status: 'error',
        position: 'bottom',
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const validatePhone = () => {
    const { cellPhone } = formData.contact;

    // Optional: allow + and digits only
    const phoneRegex = /^\+?[0-9]{7,15}$/;

    if (!cellPhone?.trim()) {
      toast({
        title: 'Invalid Contact Information',
        description: 'Phone number is required',
        status: 'error',
        position: 'bottom',
        isClosable: true,
      });
      return false;
    }

    if (!phoneRegex.test(cellPhone.trim())) {
      toast({
        title: 'Invalid Contact Information',
        description: 'Please enter a valid phone number',
        status: 'error',
        position: 'bottom',
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const handlePadDetailChange = (
    field: keyof PadPaymentDetail,
    value: string,
  ) => {
    setPadDetail((prev) => ({ ...prev, [field]: value }));
  };

  const handleChequeDetailChange = (
    field: keyof ChequePaymentDetail,
    value: string,
  ) => {
    setChequeDetail((prev) => ({ ...prev, [field]: value }));
  };
  const handleConfirmDonation = async () => {
    // Close the confirmation dialog
    onConfirmDialogClose();
    if (!validateContactNames()) return;
    if (!validateEmail()) return;
    if (!validatePhone()) return;

    // Validate Turnstile token
    if (!turnstileToken) {
      toast({
        title: 'Verification Required',
        description: 'Please complete the security verification.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      let paymentMethodId: string | undefined;

      // For Google/Apple Pay, use the already-captured payment method ID
      if (formData.paymentMethod === 'google_apple_pay') {
        if (!googleApplePayMethodId) {
          toast({
            title: 'Payment Required',
            description:
              'Please complete Google/Apple Pay authorization first.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        paymentMethodId = googleApplePayMethodId;
        // paymentIntentId is used below in the request body
      }

      // ACH Payment flow
      const selectedMethodText = availablePaymentMethods.find(
        (m) => m.value === formData.paymentMethod,
      )?.text;
      const isAch = selectedMethodText === 'ACH-USD';

      if (isAch) {
        if (!stripeCredentials) {
          toast({
            title: 'Payment Error',
            description: 'Payment system not ready. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        const achStripe = await getStripeInstance(
          stripeCredentials.publishableKey,
        );
        if (!achStripe) {
          toast({
            title: 'Payment Error',
            description: 'Failed to initialize payment system.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Step 1 — Call backend to create ACH PaymentIntent
        const achResponse = await paymentAccountService.createAchPaymentIntent(
          currentCampaignForDonation.paymentAccountId,
          {
            amount: Number(totalAmount),
            adminFee: Number(formData.tipAmount || '0'),
            user: {
              name: `${formData.contact.firstName} ${formData.contact.lastName}`,
              email: formData.contact.primaryEmail,
            },
            bankAccount: {
              routingNumber: achDetail.routingNumber,
              accountNumber: achDetail.accountNumber,
              accountHolderType: achDetail.accountHolderType,
              accountType: achDetail.accountType,
            },
            description: currentCampaignForDonation.name,
            metaData: {
              ModuleEntityUniqueId: currentCampaignForDonation.uniqueId,
              moduleId: 1, // EnumModule.Donation
            },
          },
        );

        const {
          clientSecret,
          paymentMethodId: achPaymentMethodId,
          paymentIntentId: achPaymentIntentId,
        } = achResponse;

        console.log('✅ ACH Intent created:', {
          clientSecret,
          achPaymentMethodId,
          achPaymentIntentId,
        });

        // Step 2 — Collect bank account (opens Stripe modal)
        // Matches working sample: collectBankAccountForPayment with bank details
        console.log('🏦 Step 2: Opening ACH bank modal...');
        const collectResult = await (
          achStripe as any
        ).collectBankAccountForPayment({
          clientSecret,
          params: {
            payment_method_type: 'us_bank_account',
            payment_method_data: {
              billing_details: {
                name: `${formData.contact.firstName} ${formData.contact.lastName}`,
                email: formData.contact.primaryEmail,
              },
              us_bank_account: {
                routing_number: achDetail.routingNumber,
                account_number: achDetail.accountNumber,
                account_holder_type: achDetail.accountHolderType,
                account_type: achDetail.accountType,
              },
            },
          },
        });

        if (collectResult.error) {
          toast({
            title: 'Bank Account Error',
            description: collectResult.error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const paymentMethodFromCollect =
          collectResult.paymentIntent?.payment_method;
        console.log(
          '✅ Step 2 complete. PaymentMethod:',
          paymentMethodFromCollect,
        );

        // Step 3 — Explicitly confirm the payment
        // Matches working sample: confirmUsBankAccountPayment
        console.log('🔐 Step 3: Confirming ACH payment...');
        const confirmResult = await (
          achStripe as any
        ).confirmUsBankAccountPayment(clientSecret, {
          payment_method: paymentMethodFromCollect,
        });

        if (confirmResult.error) {
          toast({
            title: 'Payment Confirmation Failed',
            description: confirmResult.error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        console.log(
          '✅ Step 3 complete. Status:',
          confirmResult.paymentIntent?.status,
        );

        // Step 4 — Submit donation
        const achDonationData: any = {
          donationAmount: Number(totalAmount),
          frequency: formData.frequency,
          paymentMethod: formData.paymentMethod,
          Notes: formData.notes || undefined,
          paymentMethodDetail: {
            paymentMethodId: paymentMethodFromCollect || achPaymentMethodId,
            paymentIntentId: achPaymentIntentId,
          },
          contact: {
            firstName: formData.contact.firstName,
            middleName: formData.contact.middleName || undefined,
            lastName: formData.contact.lastName,
            primaryEmail: formData.contact.primaryEmail,
            cellPhone: formData.contact.cellPhone || undefined,
          },
          tipDetail: {
            description: formData.tipDescription || undefined,
            amount: formData.tipAmount || undefined,
          },
        };

        await dispatch(
          submitDonation({
            campaignId: campaignId!,
            donationData: achDonationData,
            turnstileToken,
          }),
        ).unwrap();

        onSuccessModalOpen();
        return;
      }

      const isPad = selectedMethodText === 'PAD-CAD';

      if (isPad) {
        if (!stripeCredentials) {
          toast({
            title: 'Payment Error',
            description: 'Payment system not ready. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const padStripe = await getStripeInstance(
          stripeCredentials.publishableKey,
        );
        if (!padStripe) {
          toast({
            title: 'Payment Error',
            description: 'Failed to initialize payment system.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Step 1 — Create PAD PaymentIntent on backend
        const padResponse = await PaymentAccountService.createPadPaymentIntent(
          currentCampaignForDonation.paymentAccountId,
          {
            amount: Number(totalAmount),
            adminFee: Number(formData.tipAmount || '0'),
            user: {
              name: `${formData.contact.firstName} ${formData.contact.lastName}`,
              email: formData.contact.primaryEmail,
            },
            bankAccount: {
              accountNumber: padDetail.accountNumber,
              institutionNumber: padDetail.institutionNumber,
              transitNumber: padDetail.transitNumber,
            },
            description: currentCampaignForDonation.name || '',
            metaData: {
              ModuleEntityUniqueId: currentCampaignForDonation.uniqueId,
              moduleId: 1, // EnumModule.Donation
            },
          },
        );

        const {
          clientSecret,
          paymentMethodId: padPaymentMethodId,
          paymentIntentId: padPaymentIntentId,
        } = padResponse;

        // ✅ Step 2 — Pass ONLY billing_details (name + email)
        // DO NOT pass acss_debit bank details here
        // Stripe will open its own modal to collect bank info + show mandate
        const confirmResult = await (padStripe as any).confirmAcssDebitPayment(
          clientSecret,
          {
            payment_method: {
              billing_details: {
                name: `${formData.contact.firstName} ${formData.contact.lastName}`,
                email: formData.contact.primaryEmail,
              },
              // ❌ DO NOT add acss_debit: { institution_number, transit_number, account_number }
              // Adding it bypasses the modal — Stripe needs to open it itself
            },
          },
        );

        if (confirmResult.error) {
          toast({
            title: 'PAD Payment Failed',
            description: confirmResult.error.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Step 3 — Submit donation
        const padDonationData: any = {
          donationAmount: Number(totalAmount),
          frequency: formData.frequency,
          paymentMethod: formData.paymentMethod,
          Notes: formData.notes || undefined,
          paymentMethodDetail: {
            paymentMethodId:
              confirmResult.paymentIntent?.payment_method || padPaymentMethodId,
            paymentIntentId:
              confirmResult.paymentIntent?.id || padPaymentIntentId,
          },
          contact: {
            firstName: formData.contact.firstName,
            middleName: formData.contact.middleName || undefined,
            lastName: formData.contact.lastName,
            primaryEmail: formData.contact.primaryEmail,
            cellPhone: formData.contact.cellPhone || undefined,
          },
          tipDetail: {
            description: formData.tipDescription || undefined,
            amount: formData.tipAmount || undefined,
          },
        };

        await dispatch(
          submitDonation({
            campaignId: campaignId!,
            donationData: padDonationData,
            turnstileToken,
          }),
        ).unwrap();

        onSuccessModalOpen();
        return;
      }

      const isCheque = formData.paymentMethod === 'Cheque';

      if (isCheque) {
        const chequeDonationData: any = {
          donationAmount: Number(totalAmount),
          frequency: formData.frequency,
          paymentMethod: 'Cheque',
          Notes: formData.notes || undefined,
          paymentMethodDetail: {
            ChequeNo: chequeDetail.chequeNumber,
            description: chequeDetail.description || undefined,
          },
          contact: {
            firstName: formData.contact.firstName,
            middleName: formData.contact.middleName || undefined,
            lastName: formData.contact.lastName,
            primaryEmail: formData.contact.primaryEmail,
            cellPhone: formData.contact.cellPhone || undefined,
          },
          tipDetail: {
            description: formData.tipDescription || undefined,
            amount: formData.tipAmount || undefined,
          },
        };

        await dispatch(
          submitDonation({
            campaignId: campaignId!,
            donationData: chequeDonationData,
            turnstileToken,
          }),
        ).unwrap();

        onSuccessModalOpen();
        return;
      }

      // For Credit Card payments, create Stripe payment method first
      if (formData.paymentMethod === 'CreditCard') {
        if (!createPaymentMethodRef.current) {
          toast({
            title: 'Payment Error',
            description:
              'Payment system is not ready. Please wait and try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        if (!stripeReady) {
          toast({
            title: 'Card Details Incomplete',
            description: 'Please complete all card fields.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        console.log('Creating Stripe payment method...');
        const paymentMethod = await createPaymentMethodRef.current(
          formData.paymentMethodDetail.cardHolderName || '',
        );
        paymentMethodId = paymentMethod.id;
        console.log('Stripe payment method created:', paymentMethodId);
      }

      // Prepare donation data with paymentMethodId instead of raw card details
      const isWalletPay = formData.paymentMethod === 'google_apple_pay';
      const donationData: any = {
        donationAmount: Number(totalAmount),
        frequency: formData.frequency,
        paymentMethod: isWalletPay ? 'WalletPay' : formData.paymentMethod,
        Notes: formData.notes || undefined,
        paymentMethodDetail: {
          paymentMethodId: paymentMethodId,
          paymentIntentId: isWalletPay ? googleApplePayIntentId : undefined,
          cardHolderName:
            formData.paymentMethodDetail.cardHolderName || undefined,
        },
        contact: {
          firstName: formData.contact.firstName,
          middleName: formData.contact.middleName || undefined,
          lastName: formData.contact.lastName,
          primaryEmail: formData.contact.primaryEmail,
          cellPhone: formData.contact.cellPhone || undefined,
        },
        tipDetail: {
          description: formData.tipDescription || undefined,
          amount: formData.tipAmount || undefined,
        },
      };

      // ✅ Add these logs here, right before dispatch
      console.log('Payment method selected:', formData.paymentMethod);
      console.log('Is wallet pay:', isWalletPay);
      console.log(
        'Submitting donation payload:',
        JSON.stringify(donationData, null, 2),
      );

      console.log('Submitting donation:', donationData);

      // Submit donation via Redux with Turnstile token
      await dispatch(
        submitDonation({
          campaignId: campaignId!,
          donationData,
          turnstileToken,
        }),
      ).unwrap();

      // Show success modal
      onSuccessModalOpen();
    } catch (error: any) {
      console.error('Donation submission error:', error);
      console.log('Error object:', error);

      let errorMessage = 'Something went wrong. Please try again.';

      // When using unwrap(), Redux Toolkit returns the rejected value directly as a string
      // So the error caught here IS the message from rejectWithValue()
      if (typeof error === 'string') {
        errorMessage = error;
      }
      // Fallback: check if it's an error object with message property
      else if (error?.message && error.message !== 'Rejected') {
        errorMessage = error.message;
      }
      // Additional fallback: check for direct API error response
      else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      console.log('Displaying error message:', errorMessage);

      // Set error message and show failure modal
      setFailureErrorMessage(errorMessage);
      onFailureModalOpen();
    }
  };

  /** Called directly by GoogleApplePayButton after Stripe confirmation — no dialog needed */
  const handleWalletPaySuccess = async (pmId: string, piId: string) => {
    setGoogleApplePayMethodId(pmId);
    setGoogleApplePayIntentId(piId);
    try {
      const donationData: any = {
        donationAmount: Number(totalAmount),
        frequency: formData.frequency,
        paymentMethod: 'WalletPay',
        Notes: formData.notes || undefined,
        paymentMethodDetail: {
          paymentMethodId: pmId,
          paymentIntentId: piId,
          cardHolderName: undefined,
        },
        contact: {
          firstName: formData.contact.firstName,
          middleName: formData.contact.middleName || undefined,
          lastName: formData.contact.lastName,
          primaryEmail: formData.contact.primaryEmail,
          cellPhone: formData.contact.cellPhone || undefined,
        },
        tipDetail: {
          description: formData.tipDescription || undefined,
          amount: formData.tipAmount || undefined,
        },
      };
      await dispatch(
        submitDonation({
          campaignId: campaignId!,
          donationData,
          turnstileToken,
        }),
      ).unwrap();
      onSuccessModalOpen();
    } catch (error: any) {
      let errorMessage = 'Something went wrong. Please try again.';
      if (typeof error === 'string') errorMessage = error;
      else if (error?.message && error.message !== 'Rejected')
        errorMessage = error.message;
      setFailureErrorMessage(errorMessage);
      onFailureModalOpen();
    }
  };

  const textColor = 'gray.800';
  const subTextColor = 'gray.600';
  const cardBg = 'white';
  const cardBorder = 'gray.200';
  const bodyBg = 'gray.100';

  // Show loading spinner while initially fetching campaign data
  if (
    (loading.donation && !currentCampaignForDonation) ||
    !currentCampaignForDonation
  ) {
    return (
      <Box
        minH="100vh"
        bg={bodyBg}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Loader
          message="Loading Campaign..."
          subtitle="Please wait while we fetch the campaign details"
        />
      </Box>
    );
  }

  const themeColor = currentCampaignForDonation.themeColor || '#044bd9';

  const getAvailablePaymentMethods = () => {
    const methods: Array<{
      value: string;
      text: string;
      label: string;
      description: string;
      icon: string;
    }> = [];

    const apiMethods = currentCampaignForDonation?.paymentMethods || [];

    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.maxTouchPoints > 1 &&
        !/Android/.test(ua) &&
        !/Windows/.test(ua));
    const isMacSafari =
      /Macintosh/.test(ua) &&
      /Safari/.test(ua) &&
      !/Chrome/.test(ua) &&
      !/CriOS/.test(ua);
    const isApplePay = isIOS || isMacSafari;

    // Deduplicate by value
    const seen = new Set<string>();

    apiMethods.forEach((method: any) => {
      if (seen.has(method.value)) return;
      seen.add(method.value);

      const normalized = String(method.value)
        .toLowerCase()
        .replace(/[-_\s]/g, '');

      // WalletPay → Google Pay or Apple Pay
      if (normalized === 'walletpay') {
        methods.push({
          value: 'google_apple_pay',
          text: 'GoogleApplePay',
          label: isApplePay ? 'Apple Pay' : 'Google Pay',
          description: 'Pay via digital wallet',
          icon: isApplePay ? applePayIcon : googlePayIcon,
        });
        return;
      }

      // All other methods — map to display labels
      const paymentMethodMap: {
        [key: string]: { label: string; description: string; icon: string };
      } = {
        CreditCard: {
          label: 'Credit Card',
          description: 'Visa, Mastercard, Amex',
          icon: creditcardIcon,
        },
        Ach: {
          label: 'ACH-USD',
          description: 'Direct bank transfer',
          icon: ACH_icon,
        },
        Pad: {
          label: 'PAD-CAD',
          description: 'Direct bank payment',
          icon: PAD_icon,
        },
        ElectronicCheck: {
          label: 'E-Check',
          description: 'Electronic check',
          icon: creditcardIcon,
        },
        Cheque: {
          label: 'Check/Cheque',
          description: 'Paper check',
          icon: creditcardIcon,
        },
      };

      const mapped =
        paymentMethodMap[method.value] || paymentMethodMap[method.text];
      methods.push({
        value: method.value,
        text: method.text,
        label: mapped?.label || method.text,
        description: mapped?.description || 'Payment method',
        icon: mapped?.icon || creditcardIcon,
      });
    });

    return methods;
  };

  const availablePaymentMethods = getAvailablePaymentMethods();
  console.log('Available payment methods:', availablePaymentMethods);

  // Get available frequencies from API response
  const getAvailableFrequencies = () => {
    const frequencies: Array<{
      key: string;
      label: string;
      apiKey: 'oneTime' | 'monthly' | 'yearly';
    }> = [];

    if (!presets) return frequencies;

    // Check if presets exists and has the correct structure
    const oneTimePresets = presets['oneTime']?.enabled
      ? presets['oneTime'].presetDetails
      : [];
    const monthlyPresets = presets['monthly']?.enabled
      ? presets['monthly'].presetDetails
      : [];
    const yearlyPresets = presets['yearly']?.enabled
      ? presets['yearly'].presetDetails
      : [];

    console.log('Checking frequencies:', {
      oneTime: oneTimePresets,
      monthly: monthlyPresets,
      yearly: yearlyPresets,
      raw: presets,
    });

    if (oneTimePresets && oneTimePresets.length > 0) {
      frequencies.push({
        key: 'OneTime',
        label: 'One Time',
        apiKey: 'oneTime',
      });
    }
    if (monthlyPresets && monthlyPresets.length > 0) {
      frequencies.push({ key: 'Monthly', label: 'Monthly', apiKey: 'monthly' });
    }
    if (yearlyPresets && yearlyPresets.length > 0) {
      frequencies.push({ key: 'Yearly', label: 'Yearly', apiKey: 'yearly' });
    }

    console.log('Available frequencies:', frequencies);
    return frequencies;
  };

  const availableFrequencies = getAvailableFrequencies();

  // Get preset amounts based on current frequency
  const getPresetAmountsForFrequency = (frequency: string) => {
    if (!presets) return [];

    console.log('Getting presets for frequency:', frequency, presets);

    if (frequency === 'OneTime' && presets['oneTime']?.enabled) {
      return presets['oneTime'].presetDetails;
    } else if (frequency === 'Monthly' && presets['monthly']?.enabled) {
      return presets['monthly'].presetDetails;
    } else if (frequency === 'Yearly' && presets['yearly']?.enabled) {
      return presets['yearly'].presetDetails;
    }
    // Fallback to first available frequency
    if (presets['oneTime']?.enabled) return presets['oneTime'].presetDetails;
    if (presets['monthly']?.enabled) return presets['monthly'].presetDetails;
    if (presets['yearly']?.enabled) return presets['yearly'].presetDetails;
    return [];
  };

  const currentPresets = getPresetAmountsForFrequency(formData.frequency);

  return (
    <Box bg={bodyBg} minH="100vh" position="relative">
      {/* Loading Overlay - Show when submitting donation */}
      {loading.donation && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(255, 255, 255, 0.95)"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Loader
            message="Processing Your Donation..."
            subtitle="Please wait while we process your donation."
          />
        </Box>
      )}

      {/* Navbar */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        position="sticky"
        top={0}
        zIndex={100}
        boxShadow="sm"
      >
        <Container maxW="1200px">
          <Flex justify="center" align="center" h="60px">
            <Heading size="md" color={textColor} textAlign="center">
              Make a Donation
            </Heading>
          </Flex>
        </Container>
      </Box>

      <Box
        position="relative"
        overflow="hidden"
        bg="gray.900"
        sx={{
          aspectRatio: { base: '2 / 1', md: '3 / 1' },
        }}
      >
        {isBannerLoading && (
          <Skeleton w="100%" h="100%" position="absolute" inset={0} />
        )}
        <Image
          src={bannerImageUrl}
          alt="Campaign cover"
          objectFit="cover"
          w="100%"
          h="100%"
          fallbackSrc="/donation.jpg"
          onLoad={() => {
            console.log('✅ Banner image rendered in DOM:', bannerImageUrl);
          }}
          onError={(e) => {
            console.error('❌ Banner image failed to render:', bannerImageUrl);
            console.error('Error event:', e);
          }}
          style={{
            opacity: isBannerLoading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
        <Box
          position="absolute"
          inset={0}
          bg={`linear-gradient(135deg, ${themeColor}40, rgba(0,0,0,0.7))`}
        />
        {/* Mobile: Frosted glass card style */}
        <Box
          display={{ base: 'flex', md: 'none' }}
          position="absolute"
          left={0}
          right={0}
          bottom={4}
          justifyContent="center"
        >
          <Box
            px={6}
            py={3}
            borderRadius="xl"
            bg="whiteAlpha.600"
            backdropFilter="saturate(160%) blur(10px)"
            boxShadow="0 8px 24px rgba(0,0,0,0.2)"
            textAlign="center"
            maxW="90%"
          >
            <Text
              fontSize="lg"
              fontWeight="extrabold"
              color="gray.800"
              noOfLines={2}
              lineHeight="1.3"
            >
              {currentCampaignForDonation.name}
            </Text>
            <Text
              fontSize="xxs"
              mt={1}
              color="gray.600"
              noOfLines={1}
              fontWeight="medium"
            >
              Together we can make a difference ❤️
            </Text>
          </Box>
        </Box>
        {/* Desktop: Original text with shadow style */}
        <Box
          display={{ base: 'none', md: 'block' }}
          position="absolute"
          bottom={8}
          left={0}
          right={0}
        >
          <Container maxW="1200px">
            <Text
              fontSize="4xl"
              fontWeight="bold"
              color="white"
              textShadow="2px 2px 4px rgba(0, 0, 0, 0.6)"
              noOfLines={2}
            >
              {currentCampaignForDonation.name}
            </Text>
            <Text
              fontSize="lg"
              mt={2}
              color="whiteAlpha.900"
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.5)"
              fontWeight="medium"
            >
              Together we can make a difference ❤️
            </Text>
          </Container>
        </Box>
      </Box>

      {/* Progress Indicator - Below Banner */}
      <DonationProgressIndicator
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        donationAmount={formData.donationAmount}
        themeColor={themeColor}
        subTextColor={subTextColor}
      />

      {/* Main Content */}
      <Container maxW="1200px" py={8}>
        <SlideFade in={currentStep === 1} offsetY="20px">
          {currentStep === 1 && (
            <Grid templateColumns={{ base: '1fr', md: '1.5fr 1fr' }} gap={6}>
              {/* Left Column - Campaign Details */}
              <Stack gap={4} minW={0}>
                <CampaignDetails
                  fundRaisingGoal={currentCampaignForDonation.fundRaisingGoal}
                  description={currentCampaignForDonation.description}
                  themeColor={themeColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                  textColor={textColor}
                  subTextColor={subTextColor}
                />
                <FundraiseForThisButton
                  campaignUniqueId={campaignId!}
                  isPeerToPeerEnabled={currentCampaignForDonation.isPeerToPeerEnabled}
                />
              </Stack>

              {/* Right Column - Donation Card */}
              <DonationAmountSelector
                presets={presets}
                isLoadingPresets={isLoadingPresets}
                formData={formData}
                handleInputChange={handleInputChange}
                tabIndex={tabIndex}
                setTabIndex={setTabIndex}
                handleNext={() => setCurrentStep(2)}
                themeColor={themeColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subTextColor={subTextColor}
              />
            </Grid>
          )}
        </SlideFade>

        <SlideFade in={currentStep === 2} offsetY="20px">
          {currentStep === 2 && (
            <Box bg="white">
              {stripeCredentials ? (
                <StripeProvider
                  publishableKey={stripeCredentials.publishableKey}
                  stripeAccount={stripeCredentials.stripeAccount}
                >
                  <DonationStep2Content
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleContactChange={handleContactChange}
                    handlePaymentDetailChange={handlePaymentDetailChange}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    availablePaymentMethods={availablePaymentMethods}
                    showPaymentForm={true}
                    themeColor={themeColor}
                    cardBg={cardBg}
                    cardBorder={cardBorder}
                    textColor={textColor}
                    subTextColor={subTextColor}
                    onBackToAmount={() => setCurrentStep(1)}
                    onTipChange={handleTipChange}
                    totalAmount={totalAmount}
                    campaignId={campaignId!}
                    onStripeReady={setStripeReady}
                    onCreatePaymentMethodReady={(fn) => {
                      createPaymentMethodRef.current = fn;
                    }}
                    onPaymentRequestReady={(showFn) => {
                      paymentRequestShowRef.current = showFn;
                    }}
                    onGoogleApplePaySuccess={handleWalletPaySuccess}
                    turnstileComponent={
                      <Turnstile
                        siteKey={TURNSTILE_SITE_KEY}
                        onVerify={setTurnstileToken}
                        onExpire={() => setTurnstileToken('')}
                        onError={() => setTurnstileToken('')}
                      />
                    }
                    achDetail={achDetail}
                    onAchDetailChange={handleAchDetailChange}
                    onAchActionsReady={(actions) => {
                      achActionsRef.current = actions;
                    }}
                    onStripeInstanceReady={(stripeInstance) => {
                      stripeInstanceRef.current = stripeInstance;
                    }}
                    padDetail={padDetail}
                    onPadDetailChange={handlePadDetailChange}
                    chequeDetail={chequeDetail}
                    onChequeDetailChange={handleChequeDetailChange}
                    campaignName={currentCampaignForDonation.name}
                  />
                </StripeProvider>
              ) : isLoadingStripeCredentials ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <Loader
                    message="Loading payment system..."
                    subtitle="Please wait"
                  />
                </Box>
              ) : (
                <DonationStep2Content
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleContactChange={handleContactChange}
                  handlePaymentDetailChange={handlePaymentDetailChange}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  availablePaymentMethods={availablePaymentMethods.filter(
                    (m) => m.value !== 'google_apple_pay',
                  )}
                  showPaymentForm={true}
                  themeColor={themeColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                  textColor={textColor}
                  subTextColor={subTextColor}
                  campaignId={campaignId!}
                  onBackToAmount={() => setCurrentStep(1)}
                  onTipChange={handleTipChange}
                  totalAmount={totalAmount}
                  onGoogleApplePaySuccess={(pmId, piId) => {
                    setGoogleApplePayMethodId(pmId);
                    setGoogleApplePayIntentId(piId);
                  }}
                  turnstileComponent={
                    <Turnstile
                      siteKey={TURNSTILE_SITE_KEY}
                      onVerify={setTurnstileToken}
                      onExpire={() => setTurnstileToken('')}
                      onError={() => setTurnstileToken('')}
                    />
                  }
                  achDetail={achDetail}
                  onAchDetailChange={handleAchDetailChange}
                  onAchActionsReady={(actions) => {
                    achActionsRef.current = actions;
                  }}
                  padDetail={padDetail}
                  onPadDetailChange={handlePadDetailChange}
                  chequeDetail={chequeDetail}
                  onChequeDetailChange={handleChequeDetailChange}
                  campaignName={currentCampaignForDonation.name}
                />
              )}
            </Box>
          )}
        </SlideFade>
      </Container>

      {/* Success Modal */}
      <DonationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={onSuccessModalClose}
        themeColor={themeColor}
        campaignId={campaignId}
      />

      {/* Failure Modal */}
      <DonationFailureModal
        isOpen={isFailureModalOpen}
        onClose={onFailureModalClose}
        errorMessage={failureErrorMessage}
        themeColor={themeColor}
      />

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isConfirmDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onConfirmDialogClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Donation
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to proceed with this donation of $
              {totalAmount}? This action will process your payment.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onConfirmDialogClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleConfirmDonation}
                ml={3}
                bg={themeColor}
                _hover={{ opacity: 0.8 }}
              >
                Yes, Donate
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
