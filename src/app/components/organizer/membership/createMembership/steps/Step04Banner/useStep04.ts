import { useState, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

interface UseStep04Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPreviewUpdate?: (data: { bannerImage: string | null }) => void;
}

const base64ToBlob = (base64: string, mime = 'image/png'): Blob => {
  const bytes = atob(base64);
  const ab = new ArrayBuffer(bytes.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i);
  return new Blob([ab], { type: mime });
};

export function useStep04({ membershipId, isEditMode, onComplete, onPreviewUpdate }: UseStep04Props) {
  const toast = useToast();
  const [bannerPreview, setBannerPreviewState] = useState<string | null>(null);
  const [bannerFromApi, setBannerFromApi] = useState(false);
  const [isLoading, setIsLoading] = useState(!!membershipId && !!isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const skipFirstPreview = useRef(!!membershipId && !!isEditMode);

  useEffect(() => {
    if (!membershipId || !isEditMode) return;
    setIsLoading(true);
    membershipWizardService.getWizardBanner(membershipId)
      .then((res) => {
        if (res.data?.data?.bannerUrl) {
          setBannerPreviewState(res.data.data.bannerUrl);
          setBannerFromApi(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  // Live preview — skip first fire in edit mode
  useEffect(() => {
    if (skipFirstPreview.current) { skipFirstPreview.current = false; return; }
    onPreviewUpdate?.({ bannerImage: bannerPreview });
  }, [bannerPreview]);

  // Wrap setter so any user-driven change clears the "from API" flag
  const setBannerPreview = (url: string | null) => {
    setBannerPreviewState(url);
    setBannerFromApi(false);
  };

  const upload = async (bannerImage: File | null, aiGeneratedImage: string | null): Promise<void> => {
    // Banner unchanged from API — skip upload
    if (bannerFromApi && !bannerImage && !aiGeneratedImage) return;

    let file: File | Blob;
    if (bannerImage) {
      file = bannerImage;
    } else if (aiGeneratedImage) {
      file = base64ToBlob(aiGeneratedImage);
    } else {
      throw new Error('No banner selected');
    }

    await membershipWizardService.saveWizardBanner(membershipId!, file, 4);
  };

  const submit = async (bannerImage: File | null, aiGeneratedImage: string | null) => {
    if (!membershipId || isSubmitting) return;
    const hasBanner = bannerImage || aiGeneratedImage || bannerPreview;
    if (!hasBanner) {
      toast({ title: 'Error', description: 'Please upload a banner image', status: 'error', position: 'top-right' });
      return;
    }
    setIsSubmitting(true);
    try {
      await upload(bannerImage, aiGeneratedImage);
      onPreviewUpdate?.({ bannerImage: bannerPreview });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to upload', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAndExit = async (bannerImage: File | null, aiGeneratedImage: string | null, onExit: () => void) => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await upload(bannerImage, aiGeneratedImage);
      onExit();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to upload', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    bannerPreview, setBannerPreview,
    bannerFromApi,
    isLoading, isSubmitting,
    submit, saveAndExit,
  };
}
