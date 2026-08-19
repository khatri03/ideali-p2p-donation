import { useState, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

interface UseStep03Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPreviewUpdate?: (data: { selectedColor: string }) => void;
}

export function useStep03({ membershipId, isEditMode, onComplete, onPreviewUpdate }: UseStep03Props) {
  const toast = useToast();
  const [themeColor, setThemeColor] = useState('#041470');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const skipFirstPreview = useRef(!!membershipId && !!isEditMode);

  useEffect(() => {
    if (membershipId && isEditMode) {
      setIsLoading(true);
      membershipWizardService.getWizardColor(membershipId)
        .then((res) => {
          if (res.data?.data?.color) {
            setThemeColor(res.data.data.color);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [membershipId]);

  // Live preview — skip first fire in edit mode
  useEffect(() => {
    if (skipFirstPreview.current) { skipFirstPreview.current = false; return; }
    onPreviewUpdate?.({ selectedColor: themeColor });
  }, [themeColor]);

  const submit = async () => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await membershipWizardService.saveWizardColor(membershipId, themeColor, 3);
      onPreviewUpdate?.({ selectedColor: themeColor });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAndExit = async (onExit: () => void) => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await membershipWizardService.saveWizardColor(membershipId, themeColor, 3);
      onExit();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { themeColor, setThemeColor, isSubmitting, isLoading, submit, saveAndExit };
}
