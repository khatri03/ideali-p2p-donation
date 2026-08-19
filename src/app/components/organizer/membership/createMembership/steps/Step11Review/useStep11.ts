import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

export type ReviewData = {
  uniqueId: string;
  name: string;
  color: string;
  paymentAccount: { name: string; merchant: string; currency: string } | null;
  isFree: boolean;
  membershipCharges: number;
  tenure: number | null;
  annualExpiryMonth: number | null;
  annualExpiryDay: number | null;
  customExpiryDays: number | null;
  discountsEnabled: boolean;
  hasQuestions: boolean;
  requiresApproval: boolean;
  registrationStartDateUtc: string | null;
  registrationEndDateUtc: string | null;
  publishedAtUtc: string | null;
  setupState: string;
  availableForSignUp: boolean;
};

interface UseStep11Props {
  membershipId: string | null;
  onPublished: () => void;
}

export function useStep11({ membershipId, onPublished }: UseStep11Props) {
  const toast = useToast();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);
  const [availableForSignUp, setAvailableForSignUp] = useState(true);
  const [isTogglingSignUp, setIsTogglingSignUp] = useState(false);

  useEffect(() => {
    if (!membershipId) return;
    setIsLoading(true);
    membershipWizardService.getWizardReview(membershipId)
      .then((res) => {
        const d = res.data?.data;
        if (d) {
          setReviewData(d);
          setAvailableForSignUp(d.availableForSignUp);
          setIsAlreadyPublished(!!d.publishedAtUtc || d.setupState === 'Published');
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  const publish = async (signUp: boolean) => {
    if (!membershipId || isPublishing) return;
    setIsPublishing(true);
    try {
      await membershipWizardService.saveReviewData(membershipId, signUp);
      setAvailableForSignUp(signUp);
      setIsAlreadyPublished(true);
      onPublished();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to publish', status: 'error', position: 'top-right' });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveAndExit = async (onExit: () => void) => {
    if (!membershipId || isTogglingSignUp) return;
    setIsTogglingSignUp(true);
    try {
      await membershipWizardService.saveReviewData(membershipId, availableForSignUp);
      onExit();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsTogglingSignUp(false);
    }
  };

  return {
    reviewData, isLoading, isPublishing, isAlreadyPublished,
    availableForSignUp, setAvailableForSignUp, isTogglingSignUp,
    publish, saveAndExit,
  };
}
