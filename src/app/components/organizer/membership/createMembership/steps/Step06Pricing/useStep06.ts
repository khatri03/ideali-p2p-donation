import { useState, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';
import { MembershipPreviewData } from '../../../types';

export type PricingBillingCycle = 'monthly' | 'annual' | 'lifetime' | 'custom';

export const TENURE_MAP: Record<PricingBillingCycle, number> = {
  monthly: 1,
  annual: 2,
  lifetime: 3,
  custom: 4,
};

export const TENURE_REVERSE: Record<number, PricingBillingCycle> = {
  1: 'monthly',
  2: 'annual',
  3: 'lifetime',
  4: 'custom',
};

interface UseStep06Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPreviewUpdate?: (data: Partial<MembershipPreviewData>) => void;
}

export type AnnualRenewalType = 'every-year' | 'custom';

export function useStep06({ membershipId, isEditMode, onComplete, onPreviewUpdate }: UseStep06Props) {
  const toast = useToast();

  const [billingCycle, setBillingCycle] = useState<PricingBillingCycle>('monthly');
  const [membershipCharges, setMembershipCharges] = useState<string>('0.00');
  const [annualRenewalType, setAnnualRenewalType] = useState<AnnualRenewalType>('every-year');
  const [annualExpiryMonth, setAnnualExpiryMonth] = useState<number>(1);
  const [annualExpiryDay, setAnnualExpiryDay] = useState<number>(1);
  const [customExpiryDays, setCustomExpiryDays] = useState<string>('30');
  const [chargesError, setChargesError] = useState('');
  const [customDaysError, setCustomDaysError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!membershipId && !!isEditMode);
  const skipFirstPreview = useRef(!!membershipId && !!isEditMode);

  // Live preview — skip first fire in edit mode
  useEffect(() => {
    if (skipFirstPreview.current) { skipFirstPreview.current = false; return; }
    const charges = parseFloat(membershipCharges) || 0;
    onPreviewUpdate?.({
      pricingTiers: [{ id: 1, name: billingCycle, price: charges, billingCycle, description: '' }],
    });
  }, [membershipCharges, billingCycle]);

  useEffect(() => {
    if (!membershipId || !isEditMode) return;
    setIsLoading(true);
    membershipWizardService.getWizardPricing(membershipId)
      .then((res) => {
        const d = res.data?.data;
        if (!d) return;

        const cycle: PricingBillingCycle = d.tenure != null
          ? (TENURE_REVERSE[d.tenure] ?? 'monthly')
          : 'monthly';

        setBillingCycle(cycle);
        setMembershipCharges(String(d.membershipCharges ?? '0.00'));

        if (cycle === 'annual') {
          const hasCustomDates = d.annualExpiryMonth != null && d.annualExpiryMonth > 0
            && d.annualExpiryDay != null && d.annualExpiryDay > 0;
          if (hasCustomDates) {
            setAnnualExpiryMonth(d.annualExpiryMonth!);
            setAnnualExpiryDay(d.annualExpiryDay!);
            setAnnualRenewalType('custom');
          } else {
            setAnnualRenewalType('every-year');
          }
        }

        if (cycle === 'custom' && d.customExpiryDays != null) {
          setCustomExpiryDays(String(d.customExpiryDays));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  const validate = () => {
    let valid = true;
    const charges = parseFloat(membershipCharges);
    if (isNaN(charges) || charges < 0) {
      setChargesError('Please enter a valid price (0.00 for free).');
      valid = false;
    } else {
      const parts = membershipCharges.split('.');
      if (parts[1] && parts[1].length > 2) {
        setChargesError('Up to 2 decimals are allowed.');
        valid = false;
      } else {
        setChargesError('');
      }
    }
    if (billingCycle === 'custom') {
      const days = parseInt(customExpiryDays, 10);
      if (isNaN(days) || days < 1 || days > 999) {
        setCustomDaysError('Please enter a number between 1 and 999.');
        valid = false;
      } else {
        setCustomDaysError('');
      }
    } else {
      setCustomDaysError('');
    }
    return valid;
  };

  const submit = async () => {
    if (!validate() || !membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const charges = parseFloat(membershipCharges);
      await membershipWizardService.saveWizardPricing(
        membershipId,
        {
          tenure: TENURE_MAP[billingCycle],
          membershipCharges: charges,
          annualExpiryMonth: billingCycle === 'annual' && annualRenewalType === 'custom' ? annualExpiryMonth : null,
          annualExpiryDay: billingCycle === 'annual' && annualRenewalType === 'custom' ? annualExpiryDay : null,
          customExpiryDays: billingCycle === 'custom' ? parseInt(customExpiryDays, 10) : null,
        },
        6,
      );
      onPreviewUpdate?.({
        pricingTiers: [{ id: 1, name: billingCycle, price: charges, billingCycle, description: '' }],
      });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAndExit = async (onExit: () => void) => {
    if (!validate() || !membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await membershipWizardService.saveWizardPricing(
        membershipId,
        {
          tenure: TENURE_MAP[billingCycle],
          membershipCharges: parseFloat(membershipCharges),
          annualExpiryMonth: billingCycle === 'annual' && annualRenewalType === 'custom' ? annualExpiryMonth : null,
          annualExpiryDay: billingCycle === 'annual' && annualRenewalType === 'custom' ? annualExpiryDay : null,
          customExpiryDays: billingCycle === 'custom' ? parseInt(customExpiryDays, 10) : null,
        },
        6,
      );
      onExit();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    billingCycle, setBillingCycle,
    membershipCharges, setMembershipCharges,
    annualRenewalType, setAnnualRenewalType,
    annualExpiryMonth, setAnnualExpiryMonth,
    annualExpiryDay, setAnnualExpiryDay,
    customExpiryDays, setCustomExpiryDays,
    chargesError,
    customDaysError,
    isLoading,
    isSubmitting,
    submit,
    saveAndExit,
  };
}
