import CommonMethod from '../../../../service/helpers/commonMethod';
import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Text,
  Icon,
  HStack,
  Link,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { FaFileAlt, FaChevronLeft, FaClock, FaHeart } from 'react-icons/fa';
import {
  ContactInfo,
  PaymentMethodDetail,
  DonationFormData,
} from '../../../../interface/donationInter/donationFormDto';
import PaymentMethodForm from '../../settings/payment/PaymentMethodForm';
import ContactInfoForm from './ContactInfoForm';
import DonationSummary from './donationSummary';
import PaymentMethodSelector from './paymentMethodselector';
import GoogleApplePayButton from './GoogleApplePayButton';
import contactIcon from '../../../../../assets/img/organizer/donation/contact.svg';
import noteIcon from '../../../../../assets/img/organizer/donation/note.svg';

import { Image } from '@chakra-ui/react';
import AchPaymentForm, {
  AchPaymentDetail,
} from '../../settings/payment/achMethodForm';
import { useStripe } from '@stripe/react-stripe-js';
import PadPaymentForm, {
  PadPaymentDetail,
} from '../../settings/payment/PadPaymentForm';
import ChequePaymentForm, {
  ChequePaymentDetail,
} from '../../settings/payment/ChequePaymentForm';

interface Step2ContentProps {
  formData: DonationFormData;
  handleInputChange: (field: keyof DonationFormData, value: any) => void;
  handleContactChange: (
    field: keyof ContactInfo,
    value: string | number,
  ) => void;
  handlePaymentDetailChange: (
    field: keyof PaymentMethodDetail,
    value: string,
  ) => void;
  handleSubmit: () => void;
  loading: { donation: boolean };
  availablePaymentMethods: Array<{
    value: string;
    text: string;
    label: string;
    description: string;
    icon: string;
  }>;
  showPaymentForm: boolean;
  themeColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  onBackToAmount?: () => void;
  onTipChange?: (
    tipAmount: string,
    tipDescription: string,
    totalAmount: string,
  ) => void;
  totalAmount: string;
  turnstileComponent?: React.ReactNode;
  onStripeReady?: (isReady: boolean) => void;
  onCreatePaymentMethodReady?: (
    createFn: (cardHolderName: string) => Promise<any>,
  ) => void;
  onGoogleApplePaySuccess?: (
    paymentMethodId: string,
    paymentIntentId: string,
  ) => void;
  onPaymentRequestReady?: (showFn: () => void) => void;
  campaignId: string;
  achDetail: AchPaymentDetail;
  onAchDetailChange: (field: keyof AchPaymentDetail, value: string) => void;
  onAchActionsReady?: (actions: {
    collect: (clientSecret: string, formData: any) => Promise<any>;
    confirm: (clientSecret: string, paymentMethodId: string) => Promise<any>;
  }) => void;
  onStripeInstanceReady?: (stripe: any) => void;
  padDetail: PadPaymentDetail;
  onPadDetailChange: (field: keyof PadPaymentDetail, value: string) => void;
  chequeDetail: ChequePaymentDetail;
  onChequeDetailChange: (field: keyof ChequePaymentDetail, value: string) => void;
  campaignName?: string;
}

const DonationStep2Content = React.memo(
  ({
    formData,
    handleInputChange,
    handleContactChange,
    handlePaymentDetailChange,
    handleSubmit,
    loading,
    availablePaymentMethods,
    showPaymentForm,
    themeColor,
    cardBg,
    cardBorder,
    textColor,
    subTextColor,
    onBackToAmount,
    onTipChange,
    totalAmount,
    turnstileComponent,
    onStripeReady,
    onCreatePaymentMethodReady,
    onGoogleApplePaySuccess,
    onPaymentRequestReady,
    campaignId,
    achDetail,
    onAchDetailChange,
    onAchActionsReady,
    onStripeInstanceReady,
    padDetail,
    onPadDetailChange,
    chequeDetail,
    onChequeDetailChange,
    campaignName,
  }: Step2ContentProps) => {
    const toast = useToast();

    const stripe = useStripe();

    React.useEffect(() => {
      if (!stripe || !onAchActionsReady) return;
      if (stripe) {
        onStripeInstanceReady?.(stripe); // ✅ Pass stripe to parent
      }
      onAchActionsReady({
        collect: async (clientSecret, achFormData) => {
          return await (stripe as any).collectBankAccountForPayment({
            clientSecret,
            params: {
              payment_method_type: 'us_bank_account',
              payment_method_data: {
                billing_details: {
                  name: achFormData.name,
                  email: achFormData.email,
                },
                us_bank_account: {
                  routing_number: achFormData.routingNumber,
                  account_number: achFormData.accountNumber,
                  account_holder_type: achFormData.accountHolderType,
                  account_type: achFormData.accountType,
                },
              },
            },
          });
        },
        confirm: async (clientSecret, paymentMethodId) => {
          return await (stripe as any).confirmUsBankAccountPayment(
            clientSecret,
            {
              payment_method: paymentMethodId,
            },
          );
        },
      });
    }, [stripe, onAchActionsReady]);
    const isContactComplete =
      !!formData.contact.firstName.trim() &&
      !!formData.contact.lastName.trim() &&
      !!formData.contact.primaryEmail.trim() &&
      !!formData.contact.cellPhone.trim();

    return (
      <Box mx="auto" bg="white" w="100%">
        {/* Main Content */}
        <Box px={{ base: 2, md: 0 }}>
          <VStack spacing={{ base: 3, md: 5 }} align="stretch">
            {/* Header Section */}
            <Box
              bg="#E8FDF680"
              p={{ base: 4, md: 6 }}
              borderRadius="xl"
              boxShadow="lg"
            >
              <HStack
                justify="space-between"
                align={{ base: 'center', md: 'start' }}
                flexWrap="wrap"
                gap={2}
              >
                <Box bg="#E8FDF680">
                  <Text
                    fontWeight={600}
                    fontSize={{ base: '16px', md: '18px' }}
                    lineHeight="28px"
                    color={textColor}
                    mb={1}
                  >
                    Complete Payment
                  </Text>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    color={subTextColor}
                  >
                    Secure payment processing
                  </Text>
                </Box>

                <HStack
                  spacing={2}
                  px={3}
                  py={1.5}
                  borderRadius="9999px"
                  bg="#8D65CD1A"
                  borderWidth="1px"
                  borderColor="purple.200"
                  flexShrink={0}
                >
                  <Icon as={FaHeart} color="purple.500" boxSize={3} />
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="#8D65CD"
                  >
                    {formData.frequency === 'OneTime'
                      ? 'One Time'
                      : formData.frequency === 'Monthly'
                        ? 'Monthly'
                        : 'Yearly'}
                  </Text>
                </HStack>
              </HStack>
            </Box>

            {/* Back Button */}
            <HStack
              spacing={2}
              cursor="pointer"
              onClick={onBackToAmount}
              color="gray.600"
              _hover={{ color: themeColor }}
            >
              <Icon as={FaChevronLeft} />
              <Text fontSize={{ base: 'xs', md: 'sm' }}>Back to amount</Text>
            </HStack>

            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="bold"
              color="gray.800"
              ml={2}
            >
              Summary
            </Text>

            {/* Summary Section */}
            <Box
              p={{ base: 4, md: 6 }}
              borderRadius="xl"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="lg"
            >
              <DonationSummary
                formData={formData}
                themeColor={themeColor}
                textColor={textColor}
                subTextColor={subTextColor}
                onTipChange={onTipChange}
              />
            </Box>

            {/* Payment Method Selector */}
            <Box
              p={{ base: 4, md: 6 }}
              borderRadius="xl"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="lg"
            >
              <PaymentMethodSelector
                availablePaymentMethods={availablePaymentMethods}
                selectedMethod={formData.paymentMethod}
                onMethodChange={(value) =>
                  handleInputChange('paymentMethod', value)
                }
                themeColor={themeColor}
                textColor={textColor}
                subTextColor={subTextColor}
              />
            </Box>

            {/* Payment Details (Card Details) */}
            {showPaymentForm &&
              formData.paymentMethod !== 'google_apple_pay' && (
                <Box
                  p={{ base: 3, md: 4 }}
                  borderRadius="xl"
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  boxShadow="lg"
                >
                  {/* Existing Card Form — untouched */}
                  <PaymentMethodForm
                    showForm={
                      showPaymentForm &&
                      availablePaymentMethods.find(
                        (m) => m.value === formData.paymentMethod,
                      )?.text !== 'ACH-USD' &&
                      availablePaymentMethods.find(
                        (m) => m.value === formData.paymentMethod,
                      )?.text !== 'PAD-CAD' &&
                      availablePaymentMethods.find(
                        (m) => m.value === formData.paymentMethod,
                      )?.text !== 'Check/Cheque'
                    }
                    paymentMethodDetail={formData.paymentMethodDetail}
                    onPaymentDetailChange={handlePaymentDetailChange}
                    onStripeReady={onStripeReady}
                    onCreatePaymentMethodReady={onCreatePaymentMethodReady}
                    themeColor={themeColor}
                  />

                  {/* NEW — ACH / PAD Form */}
                  <AchPaymentForm
                    showForm={
                      availablePaymentMethods.find(
                        (m) => m.value === formData.paymentMethod,
                      )?.text === 'ACH-USD'
                    }
                    achDetail={achDetail}
                    onAchDetailChange={onAchDetailChange}
                    themeColor={themeColor}
                  />

                  <PadPaymentForm
                    showForm={
                      availablePaymentMethods.find(
                        (m) => m.value === formData.paymentMethod,
                      )?.text === 'PAD-CAD'
                    }
                    padDetail={padDetail}
                    onPadDetailChange={onPadDetailChange}
                    themeColor={themeColor}
                  />

                  <ChequePaymentForm
                    showForm={
                      availablePaymentMethods.find(
                        (m) => m.value === formData.paymentMethod,
                      )?.text === 'Check/Cheque'
                    }
                    chequeDetail={chequeDetail}
                    onChequeDetailChange={onChequeDetailChange}
                    themeColor={themeColor}
                  />
                </Box>
              )}

            {/* Contact Information */}
            <Box
              p={{ base: 4, md: 6 }}
              borderRadius="xl"
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              boxShadow="lg"
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Image
                  src={contactIcon}
                  alt="Contact"
                  boxSize={{ base: '16px', md: '18px' }}
                  mr={1}
                />
                <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold">
                  Contact Information
                </Text>
              </Box>
              <ContactInfoForm
                contact={formData.contact}
                onContactChange={handleContactChange}
                themeColor={themeColor}
              />
            </Box>

            {/* Notes Section */}
            {availablePaymentMethods.find(
              (m) => m.value === formData.paymentMethod,
            )?.text !== 'PAD-CAD' &&
              availablePaymentMethods.find(
                (m) => m.value === formData.paymentMethod,
              )?.text !== 'ACH-USD' && (
                <Box
                  p={{ base: 4, md: 6 }}
                  borderRadius="xl"
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  boxShadow="lg"
                >
                  <FormControl>
                    <Box display="flex" alignItems="center" mb={3}>
                      <Image
                        src={noteIcon}
                        alt="Note"
                        boxSize={{ base: '16px', md: '18px' }}
                        mr={2}
                      />
                      <FormLabel mb={0} fontSize={{ base: 'sm', md: 'md' }}>
                        Add a note (optional)
                      </FormLabel>
                    </Box>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => {
                        // Limit length using CommonMethod
                        const limitedValue = e.target.value.slice(0, 1000);
                        handleInputChange('notes', limitedValue);
                      }}
                      placeholder="Any special instructions or dedications..."
                      size={{ base: 'sm', md: 'md' }}
                      borderRadius="lg"
                      bg="#F5FAFF"
                      borderColor="gray.200"
                      rows={3}
                      _focus={{
                        borderColor: themeColor,
                        boxShadow: `0 0 0 1px ${themeColor}`,
                      }}
                    />
                  </FormControl>
                </Box>
              )}

            {/* Turnstile Security Verification */}
            {turnstileComponent && (
              <Box
                p={{ base: 4, md: 6 }}
                borderRadius="xl"
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                boxShadow="lg"
                display="flex"
                justifyContent="center"
              >
                {turnstileComponent}
              </Box>
            )}

            {/* Complete Donation Button or Wallet Pay Button */}
            {formData.paymentMethod === 'google_apple_pay' ? (
              <Box position="relative">
                <GoogleApplePayButton
                  amount={Math.round(parseFloat(totalAmount || '0') * 100)}
                  campaignId={campaignId}
                  contact={{
                    firstName: formData.contact.firstName,
                    middleName: formData.contact.middleName || undefined,
                    lastName: formData.contact.lastName,
                    primaryEmail: formData.contact.primaryEmail,
                    cellPhone: formData.contact.cellPhone,
                  }}
                  tipAmount={formData.tipAmount}
                  tipDescription={formData.tipDescription}
                  onPaymentRequestReady={(showFn) =>
                    onPaymentRequestReady?.(showFn)
                  }
                  onSuccess={(pmId, piId) =>
                    onGoogleApplePaySuccess?.(pmId, piId)
                  }
                  onError={(err) =>
                    console.error('Google/Apple Pay error:', err)
                  }
                />
                {!isContactComplete && (
                  <Tooltip
                    label="Please fill in all contact information to proceed"
                    hasArrow
                    placement="top"
                  >
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      borderRadius="lg"
                      cursor="not-allowed"
                      onClick={() =>
                        toast({
                          title: 'Contact information required',
                          description:
                            'Please fill in all contact information before proceeding.',
                          status: 'warning',
                          duration: 3000,
                          isClosable: true,
                          position: 'top',
                        })
                      }
                    />
                  </Tooltip>
                )}
              </Box>
            ) : (
              <Button
                w="100%"
                h={{ base: '48px', md: '56px' }}
                borderRadius="xl"
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="bold"
                bg={themeColor}
                color="white"
                onClick={handleSubmit}
                isLoading={loading.donation}
                loadingText="Processing..."
                leftIcon={<Text fontSize={{ base: 'md', md: 'lg' }}>💜</Text>}
                _hover={{ opacity: 0.9 }}
                _active={{ opacity: 0.8 }}
              >
                Complete Donation - ${totalAmount}
              </Button>
            )}
          </VStack>
        </Box>
      </Box>
    );
  },
);

DonationStep2Content.displayName = 'DonationStep2Content';

export default DonationStep2Content;
