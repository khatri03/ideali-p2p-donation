import React, { useState } from 'react';
import { Box } from '@chakra-ui/react';
import Step3Description from 'app/components/organizer/donation/createDonationSteps/Step3Description';
import { useStep02 } from './useStep02';
import { MembershipPreviewData } from '../../../types';
import StepNavButtons from '../../shared/StepNavButtons';
import Loader from 'app/components/common/Loader';

interface Step02Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  onPreviewUpdate?: (data: Partial<MembershipPreviewData>) => void;
}

const MAX_LENGTH = 2000;

export default function Step02Description({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
  onPreviewUpdate,
}: Step02Props) {
  const { description, setDescription, isLoading, isSubmitting, submit, saveAndExit } =
    useStep02({ membershipId, isEditMode, onComplete, onPreviewUpdate });

  const [charCount, setCharCount] = useState(0);
  const [descriptionError, setDescriptionError] = useState('');

  const handleDescriptionChange = (html: string, count: number) => {
    setDescription(html);
    setCharCount(count);
    setDescriptionError(count > MAX_LENGTH ? `Description must be ${MAX_LENGTH} characters or less.` : '');
  };

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      {/* Body */}
      <Box px={{ base: 3, md: 6 }} pt={6} pb={0}>
        {isLoading ? (
          <Loader message="Loading Description" subtitle="Fetching saved description..." />
        ) : (
        <Step3Description
          description={description}
          descriptionCharCount={charCount}
          maxLength={MAX_LENGTH}
          descriptionError={descriptionError}
          onDescriptionChange={handleDescriptionChange}
          onSaveAndNext={submit}
          onSkip={onSkip}
          onPrevStep={onPrev}
          isSubmitting={isSubmitting}
          onSaveAndExit={onSaveAndExit}
          isSavingAndExiting={isSavingAndExiting}
          stepTitle="Description"
          stepTitleFontSize="xl"
          stepTitleFontWeight="bold"
          stepTitleColor="gray.900"
          stepSubtitle="Compose the membership description with rich text formatting."
          stepSubtitleFontSize="sm"
          stepSubtitleColor="gray.400"
          renderNavigation={() => <></>}
        />
        )}
      </Box>

      {/* Footer */}
      <StepNavButtons
        onNext={submit}
        onPrev={onPrev}
        onSkip={onSkip}
        showSkip
        onSaveAndExit={onSaveAndExit ? () => saveAndExit(onSaveAndExit) : undefined}
        isSavingAndExiting={isSavingAndExiting}
        isSubmitting={isSubmitting}
        disableNext={charCount > MAX_LENGTH}
      />
    </Box>
  );
}
