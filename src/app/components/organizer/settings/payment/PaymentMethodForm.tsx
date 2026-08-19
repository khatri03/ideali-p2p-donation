import React, { useState } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  FormErrorMessage,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { PaymentMethodDetail } from '../../../../interface/donationInter/donationFormDto';
import VisaIcon from '../../../../../assets/img/organizer/donation/visa.svg';
import Amex from '../../../../../assets/img/organizer/donation/amex.svg';
import Discover from '../../../../../assets/img/organizer/donation/discover.svg';
import card from '../../../../../assets/img/organizer/donation/card.svg';
import { Image } from '@chakra-ui/react';

interface PaymentMethodFormProps {
  showForm: boolean;
  paymentMethodDetail: PaymentMethodDetail;
  onPaymentDetailChange: (
    field: keyof PaymentMethodDetail,
    value: string,
  ) => void;
  onStripeReady?: (isReady: boolean) => void;
  onCreatePaymentMethodReady?: (
    createFn: (cardHolderName: string) => Promise<any>,
  ) => void;
  themeColor?: string;
}

// Stripe Element styling
const getStripeElementStyle = (themeColor: string, textColor: string) => ({
  style: {
    base: {
      fontSize: '14px',
      color: textColor,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#a0aec0',
      },
      padding: '10px',
    },
    invalid: {
      color: '#e53e3e',
      iconColor: '#e53e3e',
    },
    complete: {
      color: textColor,
    },
  },
});

export default function PaymentMethodForm({
  showForm,
  paymentMethodDetail,
  onPaymentDetailChange,
  onStripeReady,
  onCreatePaymentMethodReady,
  themeColor = '#044bd9',
}: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const cardBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('#f7f9fc', 'blue.700');
  const cardBorder = useColorModeValue('#e2e8f0', 'gray.600');
  const textColor = useColorModeValue('#2d3748', 'white');
  const labelColor = useColorModeValue('#4a5568', 'gray.300');

  const [cardHolderError, setCardHolderError] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');
  const [cardExpiryError, setCardExpiryError] = useState('');
  const [cardCvcError, setCardCvcError] = useState('');
  const [touched, setTouched] = useState({
    cardHolderName: false,
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  // Only show payment details for Credit/Debit Card
  // Check if Stripe is loaded
  const isStripeLoaded = stripe && elements;

  // Notify parent when Stripe elements are ready
  React.useEffect(() => {
    if (!showForm) return;
    if (onStripeReady) {
      const allComplete =
        cardComplete.cardNumber &&
        cardComplete.cardExpiry &&
        cardComplete.cardCvc;
      const hasCardHolder =
        paymentMethodDetail.cardHolderName?.trim().length >= 3;
      onStripeReady(isStripeLoaded && allComplete && hasCardHolder);
    }
  }, [
    isStripeLoaded,
    cardComplete,
    paymentMethodDetail.cardHolderName,
    onStripeReady,
    showForm,
  ]);

  // Provide createPaymentMethod function to parent
  React.useEffect(() => {
    if (!showForm) return;
    if (onCreatePaymentMethodReady && stripe && elements) {
      const createPaymentMethod = async (cardHolderName: string) => {
        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) {
          throw new Error('Card element not found');
        }
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardNumberElement,
          billing_details: { name: cardHolderName },
        });
        if (error) throw new Error(error.message);
        return paymentMethod;
      };
      onCreatePaymentMethodReady(createPaymentMethod);
    }
  }, [stripe, elements, onCreatePaymentMethodReady, showForm]);

  // ✅ Early return AFTER all hooks
  if (!showForm) {
    return null;
  }

  // Validate card holder name
  const handleCardHolderNameChange = (value: string) => {
    onPaymentDetailChange('cardHolderName', value);

    if (touched.cardHolderName || value) {
      if (!value.trim()) {
        setCardHolderError('Card holder name is required');
      } else if (value.trim().length < 3) {
        setCardHolderError('Name must be at least 3 characters');
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setCardHolderError('Name can only contain letters and spaces');
      } else {
        setCardHolderError('');
      }
    }
  };

  // Handle Stripe element changes
  const handleCardNumberChange = (event: any) => {
    setCardComplete((prev) => ({ ...prev, cardNumber: event.complete }));
    if (event.error) {
      setCardNumberError(event.error.message);
    } else {
      setCardNumberError('');
    }
  };

  const handleCardExpiryChange = (event: any) => {
    setCardComplete((prev) => ({ ...prev, cardExpiry: event.complete }));
    if (event.error) {
      setCardExpiryError(event.error.message);
    } else {
      setCardExpiryError('');
    }
  };

  const handleCardCvcChange = (event: any) => {
    setCardComplete((prev) => ({ ...prev, cardCvc: event.complete }));
    if (event.error) {
      setCardCvcError(event.error.message);
    } else {
      setCardCvcError('');
    }
  };

  const stripeElementStyle = getStripeElementStyle(themeColor, textColor);

  // Wrapper style for Stripe elements to match Chakra Input
  const stripeElementWrapperStyle = {
    backgroundColor: '#F5FAFF',
    border: '1px solid',
    borderColor: cardBorder,
    borderRadius: '6px',
    padding: '10px 12px',
    minHeight: '40px',
    transition: 'all 0.2s',
  };

  return (
    <Box
      bg={cardBg}
      p={{ base: 2, md: 2 }}
      borderRadius="md"
      borderColor={cardBorder}
    >
      <VStack spacing={{ base: 3, md: 4 }} align="stretch">
        {/* Header with Card Logos */}
        <Flex
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          mb={2}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 2, sm: 0 }}
        >
          <Text
            fontWeight="semibold"
            fontSize={{ base: 'md', md: 'lg' }}
            lineHeight="24px"
            color={textColor}
            textAlign="left"
          >
            Card Details
          </Text>

          <HStack spacing={{ base: 1, md: 2 }} flexWrap="wrap">
            <Image
              src={VisaIcon}
              alt="visa"
              boxSize={{ base: '28px', md: '35px' }}
            />
            <Image
              src={card}
              alt="card"
              boxSize={{ base: '28px', md: '35px' }}
            />
            <Image
              src={Amex}
              alt="amex"
              boxSize={{ base: '28px', md: '35px' }}
            />
            <Image
              src={Discover}
              alt="discover"
              boxSize={{ base: '28px', md: '35px' }}
            />
          </HStack>
        </Flex>

        {/* PCI Compliance Notice */}
        <Text fontSize={{ base: '2xs', md: '2xs' }} color={labelColor} mb={2}>
          Your card details are securely processed by Stripe. We never store
          your card information.
        </Text>

        {/* Card Holder Name - Full Width */}
        <FormControl
          isRequired
          isInvalid={touched.cardHolderName && !!cardHolderError}
        >
          <FormLabel fontSize="xs" fontWeight="500" color={textColor} mb={1.5}>
            Name on Card
          </FormLabel>
          <Input
            placeholder="John Doe"
            maxLength={50}
            value={paymentMethodDetail.cardHolderName}
            onChange={(e) => handleCardHolderNameChange(e.target.value)}
            onBlur={() =>
              setTouched((prev) => ({ ...prev, cardHolderName: true }))
            }
            size="md"
            bg="#F5FAFF"
            borderColor={cardBorder}
            borderRadius="md"
            fontSize="sm"
            _hover={{ borderColor: 'gray.300' }}
            _focus={{
              borderColor: themeColor,
              boxShadow: `0 0 0 1px ${themeColor}`,
              bg: 'white',
            }}
          />
          <FormErrorMessage fontSize="xs">{cardHolderError}</FormErrorMessage>
        </FormControl>

        {/* Card Number, Expiry Date and CVV - All in one row */}
        <HStack
          spacing={{ base: 2, md: 3 }}
          align="flex-start"
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
        >
          {/* Card Number - Stripe Element */}
          <FormControl
            isRequired
            isInvalid={touched.cardNumber && !!cardNumberError}
            flex={{ base: '100%', md: 2 }}
          >
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Card Number
            </FormLabel>
            <Box
              sx={stripeElementWrapperStyle}
              _hover={{ borderColor: 'gray.300' }}
              _focusWithin={{
                borderColor: themeColor,
                boxShadow: `0 0 0 1px ${themeColor}`,
                bg: 'white',
              }}
            >
              <CardNumberElement
                options={{
                  ...stripeElementStyle,
                  showIcon: true,
                  disableLink: true,
                }}
                onChange={handleCardNumberChange}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, cardNumber: true }))
                }
              />
            </Box>
            {touched.cardNumber && cardNumberError && (
              <Text fontSize="xs" color="red.500" mt={1}>
                {cardNumberError}
              </Text>
            )}
          </FormControl>

          {/* Expiry Date - Stripe Element */}
          <FormControl
            isRequired
            isInvalid={touched.cardExpiry && !!cardExpiryError}
            flex={1}
            minW={{ base: '45%', md: 'auto' }}
          >
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              Expiry
            </FormLabel>
            <Box
              sx={stripeElementWrapperStyle}
              _hover={{ borderColor: 'gray.300' }}
              _focusWithin={{
                borderColor: themeColor,
                boxShadow: `0 0 0 1px ${themeColor}`,
                bg: 'white',
              }}
            >
              <CardExpiryElement
                options={stripeElementStyle}
                onChange={handleCardExpiryChange}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, cardExpiry: true }))
                }
              />
            </Box>
            {touched.cardExpiry && cardExpiryError && (
              <Text fontSize="xs" color="red.500" mt={1}>
                {cardExpiryError}
              </Text>
            )}
          </FormControl>

          {/* CVV - Stripe Element */}
          <FormControl
            isRequired
            isInvalid={touched.cardCvc && !!cardCvcError}
            flex={1}
            minW={{ base: '45%', md: 'auto' }}
          >
            <FormLabel
              fontSize="xs"
              fontWeight="500"
              color={textColor}
              mb={1.5}
            >
              CVV
            </FormLabel>
            <Box
              sx={stripeElementWrapperStyle}
              _hover={{ borderColor: 'gray.300' }}
              _focusWithin={{
                borderColor: themeColor,
                boxShadow: `0 0 0 1px ${themeColor}`,
                bg: 'white',
              }}
            >
              <CardCvcElement
                options={stripeElementStyle}
                onChange={handleCardCvcChange}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, cardCvc: true }))
                }
              />
            </Box>
            {touched.cardCvc && cardCvcError && (
              <Text fontSize="xs" color="red.500" mt={1}>
                {cardCvcError}
              </Text>
            )}
          </FormControl>
        </HStack>
      </VStack>
    </Box>
  );
}

// Export hook to create payment method
export function useCreatePaymentMethod() {
  const stripe = useStripe();
  const elements = useElements();

  const createPaymentMethod = async (cardHolderName: string) => {
    if (!stripe || !elements) {
      throw new Error('Stripe has not been initialized');
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      throw new Error('Card element not found');
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: cardHolderName,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return paymentMethod;
  };

  return { createPaymentMethod, stripe, elements };
}
