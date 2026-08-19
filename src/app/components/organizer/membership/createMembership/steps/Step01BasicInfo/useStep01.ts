import { useState, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

interface UseStep01Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: (createdId: string) => void;
  onPreviewUpdate?: (data: { name: string }) => void;
}

export function useStep01({ membershipId, isEditMode, onComplete, onPreviewUpdate }: UseStep01Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!membershipId && !!isEditMode);
  const skipFirstPreview = useRef(!!membershipId && !!isEditMode);

  useEffect(() => {
    if (membershipId && isEditMode) {
      setIsLoading(true);
      membershipWizardService.getWizardTitle(membershipId)
        .then((res) => {
          if (res.data?.data) {
            setName(res.data.data.name || '');
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [membershipId]);

  // Live preview — skip first fire in edit mode (wizard already pre-loaded the value)
  useEffect(() => {
    if (skipFirstPreview.current) { skipFirstPreview.current = false; return; }
    onPreviewUpdate?.({ name });
  }, [name]);

  const validate = () => {
    if (!name.trim() || name.trim().length < 3) {
      setNameError('Name must be at least 3 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const save = async (): Promise<string | null> => {
    if (membershipId) {
      await membershipWizardService.updateWizardTitle(membershipId, name.trim(), 1);
      return membershipId;
    } else {
      const res = await membershipWizardService.createWizardTitle(name.trim());
      return res.data.data as string;
    }
  };

  const submit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const id = await save();
      onPreviewUpdate?.({ name: name.trim() });
      onComplete(id!);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAndExit = async (onExit: () => void) => {
    if (!validate() || isSubmitting) return;
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

  return { name, setName, nameError, isSubmitting, isLoading, submit, saveAndExit };
}
