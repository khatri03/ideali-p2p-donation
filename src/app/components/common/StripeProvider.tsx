import React, { useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Default Stripe publishable key from environment (fallback)
const DEFAULT_STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Cache for Stripe instances to avoid recreating them
const stripeCache = new Map<string, Promise<Stripe | null>>();

/**
 * Get or create a Stripe instance with optional connected account
 * @param publishableKey - Stripe publishable key
 * @param stripeAccount - Optional connected account ID for Stripe Connect
 */
const getStripeInstance = (publishableKey: string, stripeAccount?: string): Promise<Stripe | null> => {
  const cacheKey = stripeAccount ? `${publishableKey}:${stripeAccount}` : publishableKey;

  if (!stripeCache.has(cacheKey)) {
    const options = stripeAccount ? { stripeAccount } : undefined;
    stripeCache.set(cacheKey, loadStripe(publishableKey, options));
  }

  return stripeCache.get(cacheKey)!;
};

// Legacy function for backward compatibility
const getStripe = () => {
  if (!DEFAULT_STRIPE_PUBLISHABLE_KEY) return null;
  return getStripeInstance(DEFAULT_STRIPE_PUBLISHABLE_KEY);
};

interface StripeProviderProps {
  children: React.ReactNode;
  /** Optional dynamic publishable key (overrides environment variable) */
  publishableKey?: string;
  /** Optional Stripe Connect account ID for processing on behalf of connected accounts */
  stripeAccount?: string;
}

export default function StripeProvider({
  children,
  publishableKey,
  stripeAccount
}: StripeProviderProps) {
  const key = publishableKey || DEFAULT_STRIPE_PUBLISHABLE_KEY;

  const stripePromise = useMemo(() => {
    if (!key) return null;
    return getStripeInstance(key, stripeAccount);
  }, [key, stripeAccount]);

  if (!key) {
    console.warn('Stripe publishable key is not configured');
  }

  // Always render Elements — even with null stripe so useStripe() / useElements()
  // return null instead of throwing when called outside a valid Elements context.
  return (
    <Elements stripe={stripePromise ?? null}>
      {children}
    </Elements>
  );
}

export { getStripe, getStripeInstance };
