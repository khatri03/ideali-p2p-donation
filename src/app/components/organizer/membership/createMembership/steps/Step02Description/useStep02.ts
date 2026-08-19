import { useState, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

interface UseStep02Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
  onPreviewUpdate?: (data: { description: string }) => void;
}

export function useStep02({ membershipId, isEditMode, onComplete, onPreviewUpdate }: UseStep02Props) {
  const toast = useToast();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!membershipId && !!isEditMode);
  const skipFirstPreview = useRef(!!membershipId && !!isEditMode);

  useEffect(() => {
    if (!membershipId || !isEditMode) return;
    setIsLoading(true);
    membershipWizardService.getWizardDescription(membershipId)
      .then((res) => {
        if (res.data?.data) {
          setDescription(res.data.data.description || '');
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  // Live preview — skip first fire in edit mode
  useEffect(() => {
    if (skipFirstPreview.current) { skipFirstPreview.current = false; return; }
    onPreviewUpdate?.({ description });
  }, [description]);

  const save = async () => {
    if (!membershipId) return;
    await membershipWizardService.saveWizardDescription(
      membershipId,
      { description, emailSubject: null, emailTemplate: '<p></p>', notifyOrganizer: false, otherNotificationEmails: null },
      2,
    );
  };

  const submit = async () => {
    console.log('Step2 membershipId:', membershipId);
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await save();
      onPreviewUpdate?.({ description });
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
      await save();
      onExit();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { description, setDescription, isLoading, isSubmitting, submit, saveAndExit };
}
