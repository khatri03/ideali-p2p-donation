import { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import Step7BannerUpload from 'app/components/organizer/donation/createDonationSteps/Step7BannerUpload';
import Loader from 'app/components/common/Loader';
import { MembershipPreviewData } from '../../../types';
import StepNavButtons from '../../shared/StepNavButtons';
import { useStep04 } from './useStep04';

interface Step04Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSaveAndExit?: () => void;
  isSavingAndExiting?: boolean;
  onPreviewUpdate?: (data: Partial<MembershipPreviewData>) => void;
}

export default function Step04Banner({
  membershipId,
  isEditMode,
  onComplete,
  onPrev,
  onSkip,
  onSaveAndExit,
  isSavingAndExiting,
  onPreviewUpdate,
}: Step04Props) {
  const { bannerPreview, setBannerPreview, isLoading, isSubmitting, submit, saveAndExit } =
    useStep04({ membershipId, isEditMode, onComplete, onPreviewUpdate });

  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)"
      overflow="hidden"
    >
      <Box px={{ base: 3, md: 6 }} pt={6} pb={2}>
        {isLoading ? (
          <Loader message="Loading Banner" subtitle="Fetching saved banner image..." />
        ) : (<>
        <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
          Upload Banner
        </Text>
        <Text fontSize="sm" color="gray.400" mb={4}>
          Upload, generate, or choose a stock image as the banner for your membership type.
        </Text>

        <Step7BannerUpload
          bannerImage={bannerImage}
          setBannerImage={setBannerImage}
          bannerPreview={bannerPreview}
          setBannerPreview={setBannerPreview}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          isGeneratingImage={isGeneratingImage}
          setIsGeneratingImage={setIsGeneratingImage}
          aiGeneratedImage={aiGeneratedImage}
          setAiGeneratedImage={setAiGeneratedImage}
          tabIndex={tabIndex}
          setTabIndex={setTabIndex}
          onPrevStep={onPrev ?? (() => {})}
          onSkip={onSkip ?? (() => {})}
          onSaveAndNext={() => submit(bannerImage, aiGeneratedImage)}
          isSubmitting={isSubmitting}
          isUploadingBanner={isSubmitting}
          onSaveAndExit={onSaveAndExit ? () => saveAndExit(bannerImage, aiGeneratedImage, onSaveAndExit) : undefined}
          isSavingAndExiting={isSavingAndExiting}
          stepTitle=""
          renderNavigation={(cropImageSrc, onCropConfirm) => (
            <Box mx={{ base: -3, md: -6 }} mt={4}>
              <StepNavButtons
                onNext={cropImageSrc ? onCropConfirm : () => submit(bannerImage, aiGeneratedImage)}
                onPrev={onPrev}
                onSkip={cropImageSrc ? undefined : onSkip}
                showSkip={!cropImageSrc}
                nextLabel={cropImageSrc ? 'Crop & Apply' : 'Save & Next'}
                onSaveAndExit={cropImageSrc ? undefined : (onSaveAndExit ? () => saveAndExit(bannerImage, aiGeneratedImage, onSaveAndExit) : undefined)}
                isSavingAndExiting={isSavingAndExiting}
                isSubmitting={isSubmitting}
                loadingText="Uploading..."
                disableNext={!cropImageSrc && !bannerPreview}
              />
            </Box>
          )}
        />
        </>)}
      </Box>
    </Box>
  );
}
