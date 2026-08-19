import React, { useEffect, useRef, useState } from 'react';
import {
  useStripe,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import { PaymentRequest } from '@stripe/stripe-js';
import { Box, Button, HStack, Spinner, Text } from '@chakra-ui/react';
import membershipService from '../services/membershipService';

interface GoogleApplePayButtonProps {
  amount: number;
  currency?: string;
  membershipId: string;
  contact: {
    firstName: string;
    middleName?: string;
    lastName: string;
    primaryEmail: string;
    cellPhone: string;
  };
  tipAmount: number;
  tipDescription: string;
  onSuccess: (paymentMethodId: string, paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

const GoogleApplePayButton: React.FC<GoogleApplePayButtonProps> = ({
  amount,
  currency = 'cad',
  membershipId,
  contact,
  tipAmount,
  tipDescription,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const [checking, setChecking] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );
  const [unavailable, setUnavailable] = useState(false);

  const contactRef = useRef(contact);
  const tipAmountRef = useRef(tipAmount);
  const tipDescriptionRef = useRef(tipDescription);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const stripeRef = useRef(stripe);

  useEffect(() => {
    contactRef.current = contact;
  }, [contact]);
  useEffect(() => {
    tipAmountRef.current = tipAmount;
  }, [tipAmount]);
  useEffect(() => {
    tipDescriptionRef.current = tipDescription;
  }, [tipDescription]);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    stripeRef.current = stripe;
  }, [stripe]);

  useEffect(() => {
    if (!stripe) {
      const timeout = setTimeout(() => setChecking(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [stripe]);

  useEffect(() => {
    if (!stripe || !amount) return;

    let mounted = true;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency.toLowerCase(),
      total: { label: 'Membership', amount },
      requestPayerName: true,
      requestPayerEmail: true,
      disableWallets: ['browserCard'],
    });

    pr.on('paymentmethod', async (event) => {
      try {
        const c = contactRef.current;
        const nameParts = (event.payerName || '').trim().split(' ');
        const gpFirstName = nameParts[0] || '';
        const gpLastName =
          nameParts.length > 1 ? nameParts.slice(1).join(' ') : gpFirstName;
        const gpEmail = event.payerEmail || '';

        const intentData = await membershipService.createStripePaymentIntent(
          membershipId,
          {
            totalAmount: amount / 100,
            paymentMethodId: event.paymentMethod.id,
            payerInfo: {
              firstName: c.firstName || gpFirstName,
              middleName: c.middleName || undefined,
              lastName: c.lastName || gpLastName,
              primaryEmail: c.primaryEmail || gpEmail,
              cellPhone: c.cellPhone || '',
            },
            tipDetail: {
              tipAmount: tipAmountRef.current || 0,
              description: tipDescriptionRef.current || 'Tip',
            },
          },
        );

        event.complete('success');

        const { error } = await stripeRef.current!.confirmCardPayment(
          intentData.clientSecret,
          { payment_method: event.paymentMethod.id },
        );

        if (error) {
          console.error('Stripe confirmCardPayment error:', error);
          onErrorRef.current?.(error.message || 'Payment confirmation failed.');
          return;
        }

        onSuccessRef.current(
          event.paymentMethod.id,
          intentData.paymentIntentId,
        );
      } catch (err: any) {
        console.error('Google/Apple/Link Pay error:', err);
        event.complete('fail');
        onErrorRef.current?.(
          err?.message || 'Payment failed. Please try again.',
        );
      }
    });

    pr.on('cancel', () => onErrorRef.current?.('Payment was cancelled.'));

    const tryCanMakePayment = (attempt: number) => {
      pr.canMakePayment().then((result) => {
        if (!mounted) return;
        if (result) {
          setPaymentRequest(pr);
          setChecking(false);
        } else if (attempt < 2) {
          setTimeout(() => tryCanMakePayment(attempt + 1), 1500);
        } else {
          setUnavailable(true);
          setChecking(false);
        }
      });
    };

    tryCanMakePayment(1);

    return () => {
      mounted = false;
    };
  }, [stripe, amount, currency, membershipId]);

  if (checking) {
    return (
      <Box
        w="100%"
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={3}
      >
        <HStack spacing={2} justify="center">
          <Spinner size="xs" color="gray.400" />
          <Text fontSize="sm" color="gray.500">
            Checking wallet availability…
          </Text>
        </HStack>
      </Box>
    );
  }

  if (unavailable || !paymentRequest) {
    return (
      <Box
        w="100%"
        borderRadius="lg"
        p={3}
        border="1px dashed"
        borderColor="gray.200"
        bg="gray.50"
      >
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Wallet payment is not available in this browser yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box w="100%">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'dark',
              height: '48px',
            },
          },
        }}
      />
    </Box>
  );
};

export default GoogleApplePayButton;
