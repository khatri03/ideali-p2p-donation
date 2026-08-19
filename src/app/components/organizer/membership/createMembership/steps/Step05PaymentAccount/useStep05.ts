import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

interface UseStep04Props {
  membershipId: string | null;
  onComplete: () => void;
}

export function useStep05({ membershipId, onComplete }: UseStep04Props) {
  const toast = useToast();
  const [paymentAccountId, setPaymentAccountId] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!membershipId || isSubmitting) return;
    if (!paymentAccountId) {
      toast({ title: 'Error', description: 'Please select a payment account', status: 'error', position: 'top-right' });
      return;
    }
    if (!paymentMethods.length) {
      toast({ title: 'Error', description: 'Please select at least one payment method', status: 'error', position: 'top-right' });
      return;
    }
    setIsSubmitting(true);
    try {
      await membershipWizardService.setPaymentAccount(membershipId, { paymentAccountId, paymentMethods });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { paymentAccountId, setPaymentAccountId, paymentMethods, setPaymentMethods, isSubmitting, submit };
}
