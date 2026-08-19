import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { useMembershipWizard } from '../../createMembership/useMembershipWizard';

export function useCreateMembershipPage() {
  const navigate = useNavigate();
  const { membershipId: membershipIdParam } = useParams<{ membershipId?: string }>();
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const wizard = useMembershipWizard(1, membershipIdParam ?? null);

  const [previewMode,       setPreviewMode]       = useState<'mobile' | 'desktop'>('mobile');
  const [showPreview,       setShowPreview]        = useState(true);
  const [isClosing,         setIsClosing]          = useState(false);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [showConfetti,      setShowConfetti]       = useState(false);

  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure();
  const { isOpen: isStepsOpen,  onOpen: onStepsOpen,  onClose: onStepsClose  } = useDisclosure();

  const handleClosePreview = () => {
    if (!isDesktop) {
      setIsClosing(true);
      setTimeout(() => { setShowPreview(false); setIsClosing(false); }, 300);
    } else {
      setShowPreview(false);
    }
  };

  const handlePublished = () => {
    onSuccessOpen();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleSaveAndExit = () => {
    setIsSavingAndExiting(true);
    setTimeout(() => {
      setIsSavingAndExiting(false);
      navigate('/organizer/membership/manage');
    }, 500);
  };

  return {
    navigate,
    membershipIdParam,
    wizard,
    previewMode, setPreviewMode,
    showPreview, setShowPreview,
    isClosing,
    isSavingAndExiting,
    showConfetti,
    isSuccessOpen, onSuccessClose,
    isStepsOpen, onStepsOpen, onStepsClose,
    handleClosePreview,
    handlePublished,
    handleSaveAndExit,
  };
}
