import { useState, useCallback, useEffect } from 'react';
import { MembershipPreviewData } from '../types';
import membershipWizardService from '../services/membershipWizardService';

const TOTAL_STEPS = 11;

const defaultPreviewData: MembershipPreviewData = {
  name: '',
  description: '',
  selectedColor: '#3182CE',
  bannerImage: null,
};

export function useMembershipWizard(initialStep = 1, initialMembershipId: string | null = null) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [membershipId, setMembershipId] = useState<string | null>(initialMembershipId);
  const [previewData, setPreviewData] = useState<MembershipPreviewData>(defaultPreviewData);
  const [isLoadingSteps, setIsLoadingSteps] = useState(!!initialMembershipId);

  useEffect(() => {
    if (!initialMembershipId) return;
    setIsLoadingSteps(true);

    // Load progress + all preview-relevant data in parallel so the preview
    // is fully populated in edit mode without needing to visit each step.
    const load = async () => {
      try {
        const progress = await membershipWizardService.getWizardProgress(initialMembershipId);

        if (progress > 0) {
          const completed = Array.from({ length: progress }, (_, i) => i + 1);
          setCompletedSteps(completed);
          setCurrentStep(Math.min(progress + 1, TOTAL_STEPS));
        }

        const [titleRes, descRes, colorRes, bannerRes, pricingRes] = await Promise.all([
          membershipWizardService.getWizardTitle(initialMembershipId).catch((): null => null),
          membershipWizardService.getWizardDescription(initialMembershipId).catch((): null => null),
          membershipWizardService.getWizardColor(initialMembershipId).catch((): null => null),
          membershipWizardService.getWizardBanner(initialMembershipId).catch((): null => null),
          membershipWizardService.getWizardPricing(initialMembershipId).catch((): null => null),
        ]);

        const patch: Partial<MembershipPreviewData> = {};

        if (titleRes?.data?.data?.name)
          patch.name = titleRes.data.data.name;

        if (descRes?.data?.data?.description)
          patch.description = descRes.data.data.description;

        if (colorRes?.data?.data?.color)
          patch.selectedColor = colorRes.data.data.color;

        if (bannerRes?.data?.data?.bannerUrl)
          patch.bannerImage = bannerRes.data.data.bannerUrl;

        if (pricingRes?.data?.data) {
          const d = pricingRes.data.data;
          const price = d.membershipCharges ?? 0;
          const cycle = (d.tenure != null ? String(d.tenure) : 'monthly') as any;
          patch.pricingTiers = [{ id: 1, name: cycle, price, billingCycle: cycle, description: '' }];
        }

        if (Object.keys(patch).length > 0)
          setPreviewData((prev) => ({ ...prev, ...patch }));

      } catch {
        // ignore — preview just shows defaults
      } finally {
        setIsLoadingSteps(false);
      }
    };

    load();
  }, [initialMembershipId]);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => Math.max(1, s - 1));
  }, []);

  const skipStep = useCallback(() => {
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      const highestCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
      const highest = Math.max(currentStep, highestCompleted + 1);
      if (step <= highest) setCurrentStep(step);
    },
    [currentStep, completedSteps],
  );

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  const isStepAccessible = useCallback(
    (step: number) => {
      const highestCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
      // Always keep the next uncompleted step accessible, even when browsing earlier steps
      const highest = Math.max(currentStep, highestCompleted + 1);
      return step <= highest;
    },
    [currentStep, completedSteps],
  );

  const updatePreview = useCallback((patch: Partial<MembershipPreviewData>) => {
    setPreviewData((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    currentStep,
    completedSteps,
    membershipId,
    setMembershipId,
    previewData,
    updatePreview,
    totalSteps: TOTAL_STEPS,
    isLoadingSteps,
    goNext,
    goPrev,
    skipStep,
    goToStep,
    markStepComplete,
    isStepAccessible,
  };
}
