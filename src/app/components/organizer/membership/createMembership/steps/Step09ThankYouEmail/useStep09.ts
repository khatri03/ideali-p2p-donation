import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

interface UseStep09Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
}

export function useStep09({ membershipId, isEditMode, onComplete }: UseStep09Props) {
  const toast = useToast();
  const [emailSubject, setEmailSubject] = useState('Welcome to your new membership!');
  const [emailBody, setEmailBody] = useState('');
  const [notifyOrganizer, setNotifyOrganizer] = useState(true);
  const [otherEmails, setOtherEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!membershipId || !isEditMode) return;
    setIsLoading(true);
    membershipWizardService.getWizardThankYouEmail(membershipId)
      .then((res) => {
        const d = res?.data?.data;
        if (!d) return;
        if (d.emailSubject) setEmailSubject(d.emailSubject);
        if (d.emailTemplate) setEmailBody(d.emailTemplate);
        setNotifyOrganizer(d.notifyOrganizer ?? true);
        if (d.otherNotificationEmails) {
          setOtherEmails(
            d.otherNotificationEmails.split(',').map((e) => e.trim()).filter(Boolean),
          );
        }
      })
      .catch(() => { /* no saved data yet — keep defaults */ })
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  const save = async () => {
    if (!membershipId) return;
    await membershipWizardService.saveWizardThankYouEmail(
      membershipId,
      { emailSubject, emailTemplate: emailBody, notifyOrganizer, otherNotificationEmails: otherEmails.join(',') },
      9,
    );
  };

  const submit = async () => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await save();
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

  return {
    emailSubject, setEmailSubject,
    emailBody, setEmailBody,
    notifyOrganizer, setNotifyOrganizer,
    otherEmails, setOtherEmails,
    isLoading, isSubmitting, submit, saveAndExit,
  };
}
