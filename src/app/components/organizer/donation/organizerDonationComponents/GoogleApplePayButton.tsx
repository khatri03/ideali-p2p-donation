import React, { useState, useEffect, useRef } from 'react';
import { useStripe, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { PaymentRequest } from '@stripe/stripe-js';
import { Box, HStack, Spinner, Text } from '@chakra-ui/react';
import donationService from 'app/service/organizer/donation/donationService';

interface GoogleApplePayButtonProps {
  amount: number; // in cents
  currency?: string;
  campaignId: string;
  contact: {
    firstName: string;
    middleName?: string;
    lastName: string;
    primaryEmail: string;
    cellPhone: string;
  };
  tipAmount: string;
  tipDescription: string;
  /** Called when the payment request is ready — receives a function to trigger the native sheet */
  onPaymentRequestReady: (showFn: () => void) => void;
  /** Called after full Stripe confirmation with the IDs to submit to your API */
  onSuccess: (paymentMethodId: string, paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

const GoogleApplePayButton: React.FC<GoogleApplePayButtonProps> = ({
  amount,
  currency = 'cad',
  campaignId,
  contact,
  tipAmount,
  tipDescription,
  onPaymentRequestReady,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const [checking, setChecking] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Refs to always read the latest prop values inside the paymentmethod handler
  const contactRef = useRef(contact);
  const tipAmountRef = useRef(tipAmount);
  const tipDescriptionRef = useRef(tipDescription);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  // stripeRef always holds the latest stripe instance (with stripeAccount) so the
  // paymentmethod handler never uses a stale closure value
  const stripeRef = useRef(stripe);
  useEffect(() => { contactRef.current = contact; }, [contact]);
  useEffect(() => { tipAmountRef.current = tipAmount; }, [tipAmount]);
  useEffect(() => { tipDescriptionRef.current = tipDescription; }, [tipDescription]);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { stripeRef.current = stripe; }, [stripe]);

  // Safety timeout — stop spinning if Stripe never loads
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
      currency: 'usd',
      total: { label: 'Donation', amount },
      requestPayerName: true,
      requestPayerEmail: true,
      disableWallets: ['browserCard'],
    });

    pr.on('paymentmethod', async (event) => {
      try {
        const c = contactRef.current;
        const nameParts = (event.payerName || '').trim().split(' ');
        const gpFirstName = nameParts[0] || '';
        const gpLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : gpFirstName;
        const gpEmail = event.payerEmail || '';

        const intentData = await donationService.createStripePaymentIntent(campaignId, {
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
            tipAmount: parseFloat(tipAmountRef.current) || 0,
            description: tipDescriptionRef.current || 'Tip',
          },
        });

        // Dismiss the native sheet before async confirmation
        event.complete('success');

        const { error } = await stripeRef.current!.confirmCardPayment(
          intentData.clientSecret,
          { payment_method: event.paymentMethod.id }
        );

        if (error) {
          console.error('Stripe confirmCardPayment error:', error);
          onErrorRef.current?.(error.message || 'Payment confirmation failed.');
          return;
        }

        onSuccessRef.current(event.paymentMethod.id, intentData.paymentIntentId);
      } catch (err: any) {
        console.error('Google/Apple/Link Pay error:', err);
        event.complete('fail');
        onErrorRef.current?.(err?.message || 'Payment failed. Please try again.');
      }
    });

    pr.on('cancel', () => onErrorRef.current?.('Payment was cancelled.'));

    const tryCanMakePayment = (attempt: number) => {
      pr.canMakePayment().then((result) => {
        if (!mounted) return;
        console.log(`[GoogleApplePayButton] canMakePayment (attempt ${attempt}):`, result);
        if (result) {
          setPaymentRequest(pr);
          onPaymentRequestReady(() => pr.show());
          setChecking(false);
        } else if (attempt < 2) {
          setTimeout(() => tryCanMakePayment(attempt + 1), 1500);
        } else {
          setUnavailable(true);
          setChecking(false);
          onPaymentRequestReady(() => {
            onErrorRef.current?.('Digital wallet not available. Please select another payment method.');
          });
        }
      });
    };

    tryCanMakePayment(1);

    return () => {
      mounted = false;
    };
  }, [stripe, amount, currency, campaignId]);

  if (checking) {
    return (
      <HStack spacing={2} py={2}>
        <Spinner size="xs" color="gray.400" />
        <Text fontSize="xs" color="gray.400">Checking wallet availability…</Text>
      </HStack>
    );
  }

  if (unavailable) {
    return (
      <Box p={3} borderRadius="lg" bg="orange.50" borderWidth="1px" borderColor="orange.200">
        <Text fontSize="sm" color="orange.700" fontWeight="semibold" mb={1}>
          Digital wallet not available
        </Text>
        <Text fontSize="xs" color="orange.600">
          No supported digital wallet was detected. Please select another payment method.
        </Text>
      </Box>
    );
  }

  if (!paymentRequest) return null;

  return (
    <Box w="100%">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'donate',
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
