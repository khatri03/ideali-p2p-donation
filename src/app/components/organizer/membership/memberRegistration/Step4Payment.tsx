import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
} from '@chakra-ui/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import paymentAccountService from 'app/service/organizer/donation/paymentAccountService';
import {
  MdCreditCard,
  MdAccountBalance,
  MdPhoneAndroid,
  MdFavorite,
  MdLocalOffer,
  MdCheck,
} from 'react-icons/md';
import { useToast } from '@chakra-ui/react';
import { MemberRegistrationInfo } from '../types';
import { PaymentMethodDetail } from 'app/interface/donationInter/donationFormDto';
import memberRegistrationService from '../services/memberRegistrationService';
import PaymentMethodForm from 'app/components/organizer/settings/payment/PaymentMethodForm';
import AchPaymentForm, {
  AchPaymentDetail,
} from 'app/components/organizer/settings/payment/achMethodForm';
import PadPaymentForm, {
  PadPaymentDetail,
} from 'app/components/organizer/settings/payment/PadPaymentForm';
import ChequePaymentForm, {
  ChequePaymentDetail,
} from 'app/components/organizer/settings/payment/ChequePaymentForm';
import RegistrationFooter from './RegistrationFooter';
import GoogleApplePayButton from './GoogleApplePayButton';

// ─── Payment product name → numeric ID (matches server contract) ──────────────

export const PAYMENT_PRODUCT_ID: Record<string, number> = {
  CreditCard: 1,
  ElectronicCheck: 2,
  Cheque: 3,
  Ach: 4,
  Pad: 5,
  TapToPay: 6,
  WalletPay: 7,
};

// Map product name → donation text key used by the form components
const API_TO_TEXT: Record<string, string> = {
  CreditCard: 'CreditCard',
  Ach: 'ACH-USD',
  Pad: 'PAD-CAD',
  Cheque: 'Check/Cheque',
  ElectronicCheck: 'Check/Cheque',
};

const METHOD_ICON: Record<string, React.ElementType> = {
  CreditCard: MdCreditCard,
  Ach: MdAccountBalance,
  Pad: MdAccountBalance,
  Cheque: MdCreditCard,
  ElectronicCheck: MdCreditCard,
  WalletPay: MdPhoneAndroid,
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export interface Step4PaymentResult {
  paymentMethodId: string;
  paymentIntentId?: string;
  cardHolderName: string;
  paymentMethodType: string; // product name (e.g. 'CreditCard')
  paymentMethodNumericId: number;
  tipAmount: number;
  totalAmount: number;
  couponUniqueId: string | null;
  discountAmount: number;
  finalInvoiceAmount: number;
}

interface ContactInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  primaryEmail: string;
  cellPhone: string;
}

interface Props {
  info: MemberRegistrationInfo;
  membershipId: string;
  onBack: () => void;
  onComplete: (result: Step4PaymentResult) => void;
  /** True while the parent is calling the registration API — used to keep the button disabled/re-enable it after the request settles. */
  isSubmitting?: boolean;
  themeColor?: string;
  contactInfo?: ContactInfo;
}

// ─── Coupon section ───────────────────────────────────────────────────────────

interface CouponSectionProps {
  membershipId: string;
  membershipCharges: number;
  onApplied: (result: {
    couponUniqueId: string;
    discountAmount: number;
    finalAmount: number;
  }) => void;
  onCleared: () => void;
}

function CouponSection({
  membershipId,
  membershipCharges,
  onApplied,
  onCleared,
}: CouponSectionProps) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await memberRegistrationService.validateCoupon(
        membershipId,
        code.trim(),
        membershipCharges,
      );
      const d = res.data?.data;
      if (res.data?.success && d?.isValid) {
        setApplied({ code: code.trim(), discountAmount: d.discountAmount });
        onApplied({
          couponUniqueId: d.couponUniqueId,
          discountAmount: d.discountAmount,
          finalAmount: d.finalAmount,
        });
        toast({
          title: 'Coupon applied!',
          status: 'success',
          position: 'top-right',
        });
      } else {
        toast({
          title: res.data?.message ?? 'Invalid coupon code',
          status: 'error',
          position: 'top-right',
        });
      }
    } catch {
      toast({
        title: 'Failed to validate coupon',
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setApplied(null);
    onCleared();
  };

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      p={4}
      boxShadow="sm"
    >
      <Flex align="center" gap={2} mb={3}>
        <Icon as={MdLocalOffer} color="#044bd9" boxSize={4} />
        <Text fontSize="sm" fontWeight="semibold" color="gray.800">
          Discount Coupon
        </Text>
      </Flex>

      {applied ? (
        <Flex align="center" justify="space-between">
          <Tag
            size="md"
            borderRadius="full"
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
          >
            <Icon as={MdCheck} color="green.500" boxSize={3} mr={1} />
            <TagLabel color="green.700" fontSize="sm">
              {applied.code}
            </TagLabel>
            <TagCloseButton onClick={handleClear} color="green.600" />
          </Tag>
          <Text fontSize="sm" fontWeight="semibold" color="green.600">
            − ${applied.discountAmount.toFixed(2)}
          </Text>
        </Flex>
      ) : (
        <Flex gap={2}>
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            bg="gray.50"
            borderColor="gray.200"
            borderRadius="lg"
            fontSize="sm"
            _focus={{ borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9' }}
          />
          <Button
            size="sm"
            px={5}
            bg="#044bd9"
            color="white"
            borderRadius="lg"
            isLoading={loading}
            onClick={handleValidate}
            _hover={{ bg: '#0340b8' }}
            flexShrink={0}
          >
            Apply
          </Button>
        </Flex>
      )}
    </Box>
  );
}

// ─── Summary panel ────────────────────────────────────────────────────────────

function SummaryPanel({
  currency,
  symbol,
  charge,
  presetTips,
  isFree,
  tipPercent,
  onTipChange,
  discountAmount,
  customTipAmount,
  onCustomTipChange,
  showCoupon,
  membershipId,
  membershipCharges,
  onCouponApplied,
  onCouponCleared,
}: {
  currency: string;
  symbol: string;
  charge: number;
  presetTips: Array<{ percent: number; isDefault: boolean }>;
  isFree: boolean;
  tipPercent: number;
  onTipChange: (p: number) => void;
  discountAmount: number;
  customTipAmount: number;
  onCustomTipChange: (amount: number) => void;
  showCoupon?: boolean;
  membershipId?: string;
  membershipCharges?: number;
  onCouponApplied?: (result: {
    couponUniqueId: string;
    discountAmount: number;
    finalAmount: number;
  }) => void;
  onCouponCleared?: () => void;
}) {
  const isOther = tipPercent === -1;
  const tipAmount = isFree
    ? 0
    : isOther
      ? customTipAmount
      : +((charge * tipPercent) / 100).toFixed(2);
  const afterDiscount = Math.max(charge - discountAmount, 0);
  const total = isFree ? 0 : +(afterDiscount + tipAmount).toFixed(2);

  const SectionLabel = ({ children }: { children: string }) => (
    <Text
      fontSize="10px"
      fontWeight="bold"
      color="#044bd9"
      textTransform="uppercase"
      letterSpacing="widest"
    >
      {children}
    </Text>
  );

  return (
    <Box
      w="full"
      bg="blue.50"
      border="1px solid"
      borderColor="blue.100"
      borderRadius="2xl"
      p={5}
      boxShadow="sm"
    >
      <Text fontSize="sm" fontWeight="bold" color="#044bd9" mb={1}>
        WHAT YOU WILL PAY
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Review the amount before selecting a payment method.
      </Text>

      <Divider borderColor="blue.200" mb={4} />

      <Flex justify="space-between" align="center" mb={3}>
        <SectionLabel>Membership</SectionLabel>
        <Text fontSize="sm" fontWeight="bold" color="gray.900">
          {isFree ? 'Free' : `${currency} ${symbol}${charge.toFixed(2)}`}
        </Text>
      </Flex>

      {showCoupon && membershipId && membershipCharges !== undefined && (
        <Box mb={discountAmount > 0 ? 3 : 4}>
          <CouponSection
            membershipId={membershipId}
            membershipCharges={membershipCharges}
            onApplied={(r) => onCouponApplied?.(r)}
            onCleared={() => onCouponCleared?.()}
          />
        </Box>
      )}

      {discountAmount > 0 && (
        <Flex justify="space-between" align="center" mb={4}>
          <SectionLabel>Discount</SectionLabel>
          <Text fontSize="sm" fontWeight="semibold" color="green.600">
            − {currency} ${discountAmount.toFixed(2)}
          </Text>
        </Flex>
      )}

      <Divider borderColor="blue.200" mb={4} />

      {!isFree && presetTips.length > 0 && (
        <>
          <Flex
            justify="space-between"
            align="center"
            mb={2}
            flexWrap="wrap"
            gap={2}
          >
            <SectionLabel>Tip</SectionLabel>
            <Flex
              align="center"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              overflow="hidden"
              bg="white"
            >
              <Select
                value={tipPercent}
                onChange={(e) => onTipChange(Number(e.target.value))}
                border="none"
                fontSize="sm"
                fontWeight="medium"
                w={{ base: '70px', md: '90px' }}
                h="34px"
                _focus={{ boxShadow: 'none' }}
                cursor="pointer"
              >
                {presetTips.map((t) => (
                  <option key={t.percent} value={t.percent}>
                    {t.percent}%
                  </option>
                ))}
                <option value={-1}>Other</option>
              </Select>
              <Flex
                bg="#044bd9"
                color="white"
                fontSize="sm"
                fontWeight="bold"
                px={3}
                h="34px"
                align="center"
                flexShrink={0}
              >
                {currency} {symbol}
              </Flex>
              <Input
                value={
                  isOther
                    ? customTipAmount === 0
                      ? ''
                      : customTipAmount
                    : tipAmount.toFixed(2)
                }
                readOnly={!isOther}
                onChange={
                  isOther
                    ? (e) =>
                        onCustomTipChange(
                          Math.max(0, Number(e.target.value) || 0),
                        )
                    : undefined
                }
                type={isOther ? 'number' : 'text'}
                min={0}
                placeholder={isOther ? '0.00' : undefined}
                border="none"
                fontSize="sm"
                w={{ base: '64px', md: '72px' }}
                minW={0}
                h="34px"
                textAlign="right"
                bg="transparent"
                _focus={{ boxShadow: 'none' }}
                px={2}
              />
            </Flex>
          </Flex>
          <Flex align="flex-start" gap={1.5} mb={4}>
            <Icon
              as={MdFavorite}
              color="blue.400"
              boxSize={3}
              flexShrink={0}
              mt="3px"
            />
            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              If you would like to give a little extra, your tip goes a long way
              in supporting us.
            </Text>
          </Flex>
          <Divider borderColor="blue.200" mb={4} />
        </>
      )}

      <Flex justify="space-between" align="center" flexWrap="wrap" gap={1}>
        <SectionLabel>Total Payable</SectionLabel>
        <Text
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight="extrabold"
          color="#044bd9"
          wordBreak="break-word"
          textAlign="right"
        >
          {isFree || total === 0
            ? 'Free'
            : `${currency} ${symbol}${total.toFixed(2)}`}
        </Text>
      </Flex>
    </Box>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

export default function Step4Payment({
  info,
  membershipId,
  onBack,
  onComplete,
  isSubmitting,
  themeColor: propThemeColor,
  contactInfo,
}: Props) {
  const toast = useToast();
  const { paymentSettings, membershipDetail, presetTips } = info;
  const {
    paymentProducts,
    paymentCurrencyCode,
    paymentCurrencySymbol,
    paymentAccountUniqueId,
  } = paymentSettings;

  const safePresetTips = useMemo(() => {
    const tips = Array.isArray(presetTips) ? [...presetTips] : [];
    if (!tips.some((t) => t.percent === 0))
      tips.unshift({ percent: 0, isDefault: false });
    return tips.sort((a, b) => a.percent - b.percent);
  }, [presetTips]);
  const defaultTipPct = safePresetTips.find((t) => t.isDefault)?.percent ?? 0;

  // ── Selection & tip ──
  const [selected, setSelected] = useState(paymentProducts[0]?.name ?? '');
  const [tipPercent, setTipPercent] = useState(defaultTipPct);
  const [customTipAmount, setCustomTipAmount] = useState(0);

  // ── Payment form details ──
  const [paymentMethodDetail, setPaymentMethodDetail] =
    useState<PaymentMethodDetail>({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardHolderName: '',
    });
  const [createPaymentMethod, setCreatePaymentMethod] = useState<
    ((name: string) => Promise<any>) | null
  >(null);
  const [achDetail, setAchDetail] = useState<AchPaymentDetail>({
    routingNumber: '',
    accountNumber: '',
    accountHolderType: 'individual',
    accountType: 'checking',
  });
  const [padDetail, setPadDetail] = useState<PadPaymentDetail>({
    institutionNumber: '',
    transitNumber: '',
    accountNumber: '',
  });
  const [chequeDetail, setChequeDetail] = useState<ChequePaymentDetail>({
    chequeNumber: '',
    description: '',
  });

  // ── Stripe credentials (lazy-loaded when CreditCard is selected) ──
  const [stripeCredentials, setStripeCredentials] = useState<{
    publishableKey: string;
    stripeAccount: string;
  } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  const selectedText = API_TO_TEXT[selected] ?? selected;
  const showPaymentForm = true;
  const [walletPaymentMethodId, setWalletPaymentMethodId] = useState<
    string | null
  >(null);
  const [walletPaymentIntentId, setWalletPaymentIntentId] = useState<
    string | null
  >(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Guards the window between clicking "Complete Registration" and onComplete firing
  // (e.g. Stripe card tokenization), which the parent's isSubmitting can't cover since
  // it only turns true once onComplete actually reaches it.
  const [localBusy, setLocalBusy] = useState(false);
  const busy = localBusy || !!isSubmitting;

  useEffect(() => {
    if (!isSubmitting) setLocalBusy(false);
  }, [isSubmitting]);

  const needsStripeCredentials =
    selectedText === 'CreditCard' ||
    selected === 'WalletPay' ||
    selectedText === 'ACH-USD' ||
    selectedText === 'PAD-CAD';

  useEffect(() => {
    if (!needsStripeCredentials) {
      setStripeCredentials(null);
      return;
    }
    setStripeLoading(true);
    memberRegistrationService
      .fetchStripePublicCredentials(paymentAccountUniqueId)
      .then((res) =>
        setStripeCredentials({
          publishableKey: res.data?.data?.publishableKey ?? '',
          stripeAccount: res.data?.data?.stripeAccount ?? '',
        }),
      )
      .catch(() =>
        toast({
          title: 'Failed to load payment credentials',
          status: 'error',
          position: 'top-right',
        }),
      )
      .finally(() => setStripeLoading(false));
  }, [needsStripeCredentials, paymentAccountUniqueId]);

  const stripePromise = useMemo(() => {
    if (!stripeCredentials?.publishableKey) return null;
    return loadStripe(stripeCredentials.publishableKey, {
      stripeAccount: stripeCredentials.stripeAccount || undefined,
    });
  }, [stripeCredentials?.publishableKey, stripeCredentials?.stripeAccount]);

  const bankStripePromise = useMemo(() => {
    if (!stripeCredentials?.publishableKey) return null;

    // ACH / PAD bank flows use Stripe Financial Connections / Link under the hood.
    // In this flow we intentionally use the plain publishable key instance, which
    // matches the working donation implementation and avoids connected-account
    // Link session requests that can 404.
    return loadStripe(stripeCredentials.publishableKey);
  }, [stripeCredentials?.publishableKey]);

  // ── Coupon ──
  const showCoupon =
    !membershipDetail.isFree &&
    info.discountsEnabled &&
    membershipDetail.discountsEnabled &&
    info.hasActiveCoupons;
  const [couponResult, setCouponResult] = useState<{
    couponUniqueId: string;
    discountAmount: number;
  } | null>(null);

  // ── Amount calculations ──
  const discountAmount = couponResult?.discountAmount ?? 0;
  const tipAmount = membershipDetail.isFree
    ? 0
    : tipPercent === -1
      ? customTipAmount
      : +((membershipDetail.membershipCharges * tipPercent) / 100);
  const afterDiscount = Math.max(
    membershipDetail.membershipCharges - discountAmount,
    0,
  );
  const totalAmount = membershipDetail.isFree
    ? 0
    : +(afterDiscount + tipAmount);
  const walletContact = contactInfo ?? {
    firstName: '',
    middleName: undefined,
    lastName: '',
    primaryEmail: '',
    cellPhone: '',
  };

  const submitPayment = (paymentMethodId: string, paymentIntentId?: string) => {
    onComplete({
      paymentMethodId,
      paymentIntentId,
      cardHolderName: paymentMethodDetail.cardHolderName,
      paymentMethodType: selected,
      paymentMethodNumericId: PAYMENT_PRODUCT_ID[selected] ?? 1,
      tipAmount: +tipAmount.toFixed(2),
      totalAmount: +totalAmount.toFixed(2),
      couponUniqueId: couponResult?.couponUniqueId ?? null,
      discountAmount,
      finalInvoiceAmount: +totalAmount.toFixed(2),
    });
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (busy) return;
    setLocalBusy(true);

    let paymentMethodId = '';
    let paymentIntentId: string | undefined = walletPaymentIntentId ?? undefined;
    const holderName = `${contactInfo?.firstName ?? ''} ${contactInfo?.lastName ?? ''}`.trim();

    if (selected === 'WalletPay') {
      if (!walletPaymentMethodId) {
        toast({
          title: 'Apple/Google Pay is not ready yet. Please try again.',
          status: 'warning',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      paymentMethodId = walletPaymentMethodId;
    } else if (selectedText === 'CreditCard') {
      if (!createPaymentMethod) {
        toast({
          title: 'Payment not ready. Please wait.',
          status: 'warning',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      try {
        const pm = await createPaymentMethod(
          paymentMethodDetail.cardHolderName,
        );
        paymentMethodId = pm?.id ?? '';
      } catch (err: any) {
        toast({
          title: err?.message ?? 'Card error',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
    } else if (selectedText === 'ACH-USD') {
      if (!achDetail.routingNumber || achDetail.routingNumber.length !== 9) {
        toast({
          title: 'Invalid Routing Number',
          description: 'Please enter a valid 9-digit routing number.',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      if (!achDetail.accountNumber || achDetail.accountNumber.length < 4) {
        toast({
          title: 'Invalid Account Number',
          description: 'Please enter a valid account number.',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      if (!stripeCredentials) {
        toast({
          title: 'Payment Error',
          description: 'Payment system not ready. Please try again.',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      try {
        // Reuse the exact Stripe.js instance mounted into <Elements> below — a separately
        // created instance (even with identical keys) has no rendered Elements context for
        // Stripe to attach its collect/confirm modal to.
        const achStripe = await bankStripePromise;
        if (!achStripe) {
          toast({
            title: 'Payment Error',
            description: 'Failed to initialize payment system.',
            status: 'error',
            position: 'top-right',
          });
          setLocalBusy(false);
          return;
        }

        const achResponse = await paymentAccountService.createAchPaymentIntent(
          paymentAccountUniqueId,
          {
            amount: +totalAmount.toFixed(2),
            adminFee: +tipAmount.toFixed(2),
            user: { name: holderName, email: contactInfo?.primaryEmail ?? '' },
            bankAccount: {
              routingNumber: achDetail.routingNumber,
              accountNumber: achDetail.accountNumber,
              accountHolderType: achDetail.accountHolderType,
              accountType: achDetail.accountType,
            },
            description: membershipDetail.name,
            metaData: { ModuleEntityUniqueId: membershipId, moduleId: 5 },
          },
        );

        const {
          clientSecret,
          paymentMethodId: achPaymentMethodId,
          paymentIntentId: achPaymentIntentId,
        } = achResponse;

        const collectResult = await (achStripe as any).collectBankAccountForPayment({
          clientSecret,
          params: {
            payment_method_type: 'us_bank_account',
            payment_method_data: {
              billing_details: { name: holderName, email: contactInfo?.primaryEmail ?? '' },
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
            position: 'top-right',
          });
          setLocalBusy(false);
          return;
        }

        const paymentMethodFromCollect = collectResult.paymentIntent?.payment_method;

        const confirmResult = await (achStripe as any).confirmUsBankAccountPayment(
          clientSecret,
          { payment_method: paymentMethodFromCollect },
        );

        if (confirmResult.error) {
          toast({
            title: 'Payment Confirmation Failed',
            description: confirmResult.error.message,
            status: 'error',
            position: 'top-right',
          });
          setLocalBusy(false);
          return;
        }

        paymentMethodId = paymentMethodFromCollect || achPaymentMethodId;
        paymentIntentId = achPaymentIntentId;
      } catch (err: any) {
        toast({
          title: 'Payment Error',
          description: err?.message ?? 'Failed to process ACH payment',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
    } else if (selectedText === 'PAD-CAD') {
      if (!padDetail.institutionNumber || padDetail.institutionNumber.length !== 3) {
        toast({
          title: 'Invalid Institution Number',
          description: 'Please enter a valid 3-digit institution number.',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      if (!padDetail.transitNumber || padDetail.transitNumber.length !== 5) {
        toast({
          title: 'Invalid Transit Number',
          description: 'Please enter a valid 5-digit transit number.',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      if (!padDetail.accountNumber || padDetail.accountNumber.length < 4) {
        toast({
          title: 'Invalid Account Number',
          description: 'Please enter a valid account number.',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      if (!stripeCredentials) {
        toast({
          title: 'Payment Error',
          description: 'Payment system not ready. Please try again.',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
      try {
        // Reuse the exact Stripe.js instance mounted into <Elements> below — see ACH branch above.
        const padStripe = await bankStripePromise;
        if (!padStripe) {
          toast({
            title: 'Payment Error',
            description: 'Failed to initialize payment system.',
            status: 'error',
            position: 'top-right',
          });
          setLocalBusy(false);
          return;
        }

        const padResponse = await paymentAccountService.createPadPaymentIntent(
          paymentAccountUniqueId,
          {
            amount: +totalAmount.toFixed(2),
            adminFee: +tipAmount.toFixed(2),
            user: { name: holderName, email: contactInfo?.primaryEmail ?? '' },
            bankAccount: {
              accountNumber: padDetail.accountNumber,
              institutionNumber: padDetail.institutionNumber,
              transitNumber: padDetail.transitNumber,
            },
            description: membershipDetail.name,
            metaData: { ModuleEntityUniqueId: membershipId, moduleId: 5 },
          },
        );

        const {
          clientSecret,
          paymentMethodId: padPaymentMethodId,
          paymentIntentId: padPaymentIntentId,
        } = padResponse;

        // Passing only billing_details — Stripe opens its own modal to collect bank info + mandate.
        const confirmResult = await (padStripe as any).confirmAcssDebitPayment(clientSecret, {
          payment_method: {
            billing_details: { name: holderName, email: contactInfo?.primaryEmail ?? '' },
          },
        });

        if (confirmResult.error) {
          toast({
            title: 'PAD Payment Failed',
            description: confirmResult.error.message,
            status: 'error',
            position: 'top-right',
          });
          setLocalBusy(false);
          return;
        }

        paymentMethodId = confirmResult.paymentIntent?.payment_method || padPaymentMethodId;
        paymentIntentId = confirmResult.paymentIntent?.id || padPaymentIntentId;
      } catch (err: any) {
        toast({
          title: 'Payment Error',
          description: err?.message ?? 'Failed to process PAD payment',
          status: 'error',
          position: 'top-right',
        });
        setLocalBusy(false);
        return;
      }
    }

    submitPayment(paymentMethodId, paymentIntentId);
  };

  const walletFooterContent =
    selected === 'WalletPay' ? (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-end"
        minW={{ base: '100%', md: '260px' }}
      >
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <GoogleApplePayButton
              amount={Math.round(totalAmount * 100)}
              currency={paymentCurrencyCode?.toLowerCase() || 'cad'}
              membershipId={membershipId}
              contact={walletContact}
              tipAmount={tipAmount}
              tipDescription={`Tip Amount-${tipPercent}%`}
              onSuccess={(pmId, piId) => {
                setWalletPaymentMethodId(pmId);
                setWalletPaymentIntentId(piId);
                setWalletError(null);
                toast({
                  title: 'Wallet payment successful',
                  status: 'success',
                  position: 'top-right',
                });
                submitPayment(pmId, piId);
              }}
              onError={(error) => {
                setWalletPaymentMethodId(null);
                setWalletPaymentIntentId(null);
                setWalletError(error);
                toast({ title: error, status: 'error', position: 'top-right' });
              }}
            />
          </Elements>
        ) : (
          <Text fontSize="sm" color="red.500">
            Payment credentials unavailable.
          </Text>
        )}
        {walletError && (
          <Text fontSize="xs" color="red.500" mt={2}>
            {walletError}
          </Text>
        )}
      </Box>
    ) : undefined;

  return (
    <Box flex={1} display="flex" flexDirection="column" minH={0}>
      <Box
        flex={1}
        overflowY="auto"
        px={{ base: 4, md: 8 }}
        py={6}
        bg="gray.50"
      >
        <Flex
          gap={4}
          align="flex-start"
          flexDirection={{ base: 'column', lg: 'row' }}
        >
          {/* ── Left ── */}
          <Flex
            w={{ base: 'full', lg: '60%' }}
            flexShrink={0}
            direction="column"
            gap={3}
            minW={0}
          >
            <Text fontSize="sm" color="gray.600" mb={1}>
              Select your desired payment method.
            </Text>

            {/* Method selector cards — 3 per row */}
            <Grid
              templateColumns={{
                base: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              }}
              gap={3}
            >
              {paymentProducts.map((product) => {
                const isSelected = selected === product.name;
                return (
                  <Box
                    key={product.name}
                    border="2px solid"
                    borderColor={isSelected ? '#044bd9' : 'gray.200'}
                    borderRadius="xl"
                    p={4}
                    bg="white"
                    cursor="pointer"
                    onClick={() => setSelected(product.name)}
                    boxShadow={
                      isSelected ? '0 0 0 3px rgba(4,75,217,0.1)' : 'sm'
                    }
                    transition="all 0.15s"
                  >
                    <Flex
                      direction="column"
                      align="center"
                      gap={2}
                      textAlign="center"
                    >
                      <Flex
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        border="2px solid"
                        borderColor={isSelected ? '#044bd9' : 'gray.200'}
                        bg={isSelected ? 'blue.50' : 'gray.50'}
                        align="center"
                        justify="center"
                      >
                        <Icon
                          as={METHOD_ICON[product.name] ?? MdCreditCard}
                          boxSize={5}
                          color={isSelected ? '#044bd9' : 'gray.400'}
                        />
                      </Flex>
                      <Text
                        fontSize="xs"
                        fontWeight={isSelected ? 'bold' : 'medium'}
                        color={isSelected ? '#044bd9' : 'gray.600'}
                        lineHeight="tight"
                      >
                        {product.displayName}
                      </Text>
                      {isSelected && (
                        <Box w="8px" h="8px" borderRadius="full" bg="#044bd9" />
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Grid>

            {/* Payment forms — separate box, no parent click interference */}
            {showPaymentForm && (
              <Box
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="xl"
                p={4}
                boxShadow="sm"
              >
                {selected === 'WalletPay' && (
                  <Text fontSize="sm" color="gray.600">
                    Use Apple Pay or Google Pay to complete your registration.
                  </Text>
                )}
                {/* CreditCard — wrapped in dynamically loaded Stripe Elements */}
                {selectedText === 'CreditCard' &&
                  (stripeLoading ? (
                    <Flex align="center" justify="center" gap={3} py={6}>
                      <Spinner size="sm" color="#044bd9" />
                      <Text fontSize="sm" color="gray.500">
                        Loading secure payment...
                      </Text>
                    </Flex>
                  ) : stripePromise ? (
                    <Elements stripe={stripePromise}>
                      <PaymentMethodForm
                        showForm
                        paymentMethodDetail={paymentMethodDetail}
                        onPaymentDetailChange={(field, value) =>
                          setPaymentMethodDetail((prev) => ({
                            ...prev,
                            [field]: value,
                          }))
                        }
                        onStripeReady={() => {}}
                        onCreatePaymentMethodReady={(fn) =>
                          setCreatePaymentMethod(() => fn)
                        }
                        themeColor="#044bd9"
                      />
                    </Elements>
                  ) : (
                    <Text fontSize="sm" color="red.500">
                      Payment credentials unavailable.
                    </Text>
                  ))}

                {/* ACH/PAD — also need a live Elements context for Stripe's collectBankAccount/confirmAcssDebit modals to mount */}
                {(selectedText === 'ACH-USD' || selectedText === 'PAD-CAD') && bankStripePromise && (
                  <Elements stripe={bankStripePromise}>
                    <AchPaymentForm
                      showForm={selectedText === 'ACH-USD'}
                      achDetail={achDetail}
                      onAchDetailChange={(field, value) =>
                        setAchDetail((prev) => ({ ...prev, [field]: value }))
                      }
                      themeColor="#044bd9"
                    />
                    <PadPaymentForm
                      showForm={selectedText === 'PAD-CAD'}
                      padDetail={padDetail}
                      onPadDetailChange={(field, value) =>
                        setPadDetail((prev) => ({ ...prev, [field]: value }))
                      }
                      themeColor="#044bd9"
                    />
                  </Elements>
                )}
                <ChequePaymentForm
                  showForm={selectedText === 'Check/Cheque'}
                  chequeDetail={chequeDetail}
                  onChequeDetailChange={(field, value) =>
                    setChequeDetail((prev) => ({ ...prev, [field]: value }))
                  }
                  themeColor="#044bd9"
                />
              </Box>
            )}
          </Flex>

          {/* ── Right: summary ── */}
          <Box
            w={{ base: 'full', lg: '40%' }}
            flexShrink={0}
            mt={{ base: 0, lg: 8 }}
          >
            <SummaryPanel
              currency={paymentCurrencyCode}
              symbol={paymentCurrencySymbol}
              charge={membershipDetail.membershipCharges}
              presetTips={safePresetTips}
              isFree={membershipDetail.isFree}
              tipPercent={tipPercent}
              onTipChange={setTipPercent}
              discountAmount={discountAmount}
              customTipAmount={customTipAmount}
              onCustomTipChange={setCustomTipAmount}
              showCoupon={showCoupon}
              membershipId={membershipId}
              membershipCharges={membershipDetail.membershipCharges}
              onCouponApplied={(r) =>
                setCouponResult({
                  couponUniqueId: r.couponUniqueId,
                  discountAmount: r.discountAmount,
                })
              }
              onCouponCleared={() => setCouponResult(null)}
            />
          </Box>
        </Flex>
      </Box>

      <RegistrationFooter
        onBack={onBack}
        onContinue={selected !== 'WalletPay' ? handleSubmit : undefined}
        continueLabel="Complete Registration"
        isLoading={busy}
        color={propThemeColor ?? info.membershipDetail.color ?? '#044bd9'}
        rightContent={walletFooterContent}
      />
    </Box>
  );
}
