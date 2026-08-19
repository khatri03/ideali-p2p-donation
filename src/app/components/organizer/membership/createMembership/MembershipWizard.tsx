import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import { MembershipPreviewData } from '../types';

import Step01BasicInfo       from './steps/Step01BasicInfo';
import Step02Description     from './steps/Step02Description';
import Step03Color           from './steps/Step03Color';
import Step04Banner          from './steps/Step04Banner';
import Step05PaymentAccount  from './steps/Step05PaymentAccount';
import Step06Pricing         from './steps/Step06Pricing';
import Step07DiscountCoupons from './steps/Step07DiscountCoupons';
import Step08Questions       from './steps/Step08Questions';
import Step09ThankYouEmail   from './steps/Step09ThankYouEmail';
import Step10AdvanceSettings from './steps/Step10AdvanceSettings';
import Step11Review          from './steps/Step11Review';

interface MembershipWizardProps {
  currentStep: number;
  membershipId: string | null;
  onMembershipCreated: (id: string) => void;
  onStepComplete: (step: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onPublished: () => void;
  onSaveAndExit: () => void;
  isSavingAndExiting: boolean;
  onPreviewUpdate: (data: Partial<MembershipPreviewData>) => void;
}

export default function MembershipWizard({
  currentStep,
  membershipId,
  onMembershipCreated,
  onStepComplete,
  onNext,
  onPrev,
  onSkip,
  onPublished,
  onSaveAndExit,
  isSavingAndExiting,
  onPreviewUpdate,
}: MembershipWizardProps) {
  const done = (step: number) => { onStepComplete(step); onNext(); };

  // Track which steps have been mounted at least once — once mounted, keep alive
  const mountedRef = useRef<Set<number>>(new Set());
  mountedRef.current.add(currentStep);
  const mounted = mountedRef.current;

  // True only when editing an existing membership (membershipId set at mount time from URL param).
  // False during a new creation (membershipId starts null, becomes non-null after step 1 saves).
  // Prevents each step from calling its GET API on first visit in create mode.
  const isEditMode = useRef(membershipId !== null).current;

  const show = (step: number) => currentStep === step;
  // Keep a step mounted once visited; steps 2–11 also require membershipId to exist
  const shouldRender = (step: number) =>
    show(step) || (mounted.has(step) && (step === 1 || !!membershipId));

  return (
    <Box maxW="100%" h="100%">

      {shouldRender(1) && (
        <Box display={show(1) ? 'block' : 'none'}>
          <Step01BasicInfo
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={(id) => { onMembershipCreated(id); done(1); }}
            onSkip={(tempId) => { onMembershipCreated(tempId); done(1); }}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
            onPreviewUpdate={onPreviewUpdate}
          />
        </Box>
      )}

      {shouldRender(2) && (
        <Box display={show(2) ? 'block' : 'none'}>
          <Step02Description
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(2)}
            onPrev={onPrev}
            onSkip={onSkip}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
            onPreviewUpdate={onPreviewUpdate}
          />
        </Box>
      )}

      {shouldRender(3) && (
        <Box display={show(3) ? 'block' : 'none'}>
          <Step03Color
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(3)}
            onPrev={onPrev}
            onSkip={onSkip}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
            onPreviewUpdate={onPreviewUpdate}
          />
        </Box>
      )}

      {shouldRender(4) && (
        <Box display={show(4) ? 'block' : 'none'}>
          <Step04Banner
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(4)}
            onPrev={onPrev}
            onSkip={onSkip}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
            onPreviewUpdate={onPreviewUpdate}
          />
        </Box>
      )}

      {shouldRender(5) && (
        <Box display={show(5) ? 'block' : 'none'}>
          <Step05PaymentAccount
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(5)}
            onPrev={onPrev}
            onSkip={onSkip}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
          />
        </Box>
      )}

      {shouldRender(6) && (
        <Box display={show(6) ? 'block' : 'none'}>
          <Step06Pricing
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(6)}
            onPrev={onPrev}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
            onPreviewUpdate={onPreviewUpdate}
          />
        </Box>
      )}

      {shouldRender(7) && (
        <Box display={show(7) ? 'block' : 'none'}>
          <Step07DiscountCoupons
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(7)}
            onPrev={onPrev}
            onSkip={onSkip}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
          />
        </Box>
      )}

      {shouldRender(8) && (
        <Box display={show(8) ? 'block' : 'none'}>
          <Step08Questions
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(8)}
            onPrev={onPrev}
            onSkip={onSkip}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
          />
        </Box>
      )}

      {shouldRender(9) && (
        <Box display={show(9) ? 'block' : 'none'}>
          <Step09ThankYouEmail
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(9)}
            onPrev={onPrev}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
          />
        </Box>
      )}

      {shouldRender(10) && (
        <Box display={show(10) ? 'block' : 'none'}>
          <Step10AdvanceSettings
            membershipId={membershipId}
            isEditMode={isEditMode}
            onComplete={() => done(10)}
            onPrev={onPrev}
            onSkip={onSkip}
            onSaveAndExit={onSaveAndExit}
            isSavingAndExiting={isSavingAndExiting}
          />
        </Box>
      )}

      {shouldRender(11) && (
        <Box display={show(11) ? 'block' : 'none'}>
          <Step11Review
            membershipId={membershipId}
            onPublished={onPublished}
            onPrev={onPrev}
            onSaveAndExit={onSaveAndExit}
          />
        </Box>
      )}

    </Box>
  );
}
