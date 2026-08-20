import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Box, Button, Text, useDisclosure, useToast } from '@chakra-ui/react';
import ConfirmationModal from 'app/components/common/ConfirmationModal';
import {
  PeerToPeerSettings,
  PeerToPeerSettingsDetail,
} from 'app/interface/donationInter/peerToPeerDto';
import PeerToPeerSettingsFields from '../peerToPeer/PeerToPeerSettingsFields';
import PeerToPeerSettingsSkeleton from '../peerToPeer/PeerToPeerSettingsSkeleton';
import {
  SWITCH_OFF_CANCEL,
  SWITCH_OFF_CONFIRM,
  SWITCH_OFF_TITLE,
  switchOffMessage,
} from '../peerToPeer/peerToPeerCopy';
import { usePeerToPeerSettings } from '../peerToPeer/usePeerToPeerSettings';
import { usePeerToPeerSettingsForm } from '../peerToPeer/usePeerToPeerSettingsForm';
import StepNavigationButtons from './shared/StepNavigationButtons';

export interface Step9PeerToPeerProps {
  campaignUniqueId: string;
  onSaveAndNext: () => void;
  onSkip: () => void;
  onPrevStep: () => void;
  onExit: () => void;
  onStepComplete?: () => void;
  isSubmitting: boolean;
  stepTitle?: string;
}

interface PeerToPeerStepFormProps {
  settings: PeerToPeerSettingsDetail;
  isSaving: boolean;
  isSubmitting: boolean;
  save: (values: PeerToPeerSettings) => Promise<string | null>;
  onSaveAndNext: () => void;
  onSkip: () => void;
  onPrevStep: () => void;
  onExit: () => void;
  onStepComplete?: () => void;
}

/**
 * The editable half of the step. Split out so its form state only mounts once the settings have
 * loaded, instead of being seeded from a placeholder and then reset.
 */
function PeerToPeerStepForm({
  settings,
  isSaving,
  isSubmitting,
  save,
  onSaveAndNext,
  onSkip,
  onPrevStep,
  onExit,
  onStepComplete,
}: PeerToPeerStepFormProps) {
  const toast = useToast();
  const confirmation = useDisclosure();
  const [pendingValues, setPendingValues] = useState<PeerToPeerSettings | null>(null);
  const form = usePeerToPeerSettingsForm(settings, isSaving);

  const commit = async (values: PeerToPeerSettings, shouldAdvance: boolean) => {
    const failure = await save(values);

    if (failure) {
      toast({
        title: 'Not saved',
        description: failure,
        status: 'error',
        position: 'top-right',
        duration: 6000,
        isClosable: true,
      });
      return;
    }

    onStepComplete?.();

    if (shouldAdvance) {
      onSaveAndNext();
      return;
    }

    onExit();
  };

  const submit = (shouldAdvance: boolean) => {
    if (!form.validate()) {
      return;
    }

    const values = form.buildValues();

    if (form.isSwitchingOff()) {
      setPendingValues(values);
      confirmation.onOpen();
      return;
    }

    void commit(values, shouldAdvance);
  };

  const handleConfirmSwitchOff = async () => {
    if (!pendingValues) {
      return;
    }

    const values = pendingValues;
    confirmation.onClose();
    setPendingValues(null);
    await commit(values, true);
  };

  return (
    <>
      <PeerToPeerSettingsFields settings={settings} form={form} isSaving={isSaving} />

      <StepNavigationButtons
        onPrev={onPrevStep}
        onSkip={onSkip}
        onNext={() => submit(true)}
        onSaveAndExit={() => submit(false)}
        isSubmitting={isSubmitting || isSaving}
        isSavingAndExiting={isSaving}
        showSkip
        disableSkip={isSaving}
        disableNext={form.isSwitchLocked}
      />

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => {
          confirmation.onClose();
          setPendingValues(null);
        }}
        onConfirm={handleConfirmSwitchOff}
        title={SWITCH_OFF_TITLE}
        message={switchOffMessage(settings.liveFundraiserCount)}
        confirmText={SWITCH_OFF_CONFIRM}
        cancelText={SWITCH_OFF_CANCEL}
        type="warning"
        isLoading={isSaving}
      />
    </>
  );
}

/**
 * Step 9: Peer-to-peer fundraising.
 *
 * Reads and writes through the campaign's own peer-to-peer endpoints rather than the wizard's form
 * state, so the settings edited here and on the settings page cannot drift apart.
 */
export default function Step9PeerToPeer({
  campaignUniqueId,
  onSaveAndNext,
  onSkip,
  onPrevStep,
  onExit,
  onStepComplete,
  isSubmitting,
  stepTitle = 'Peer-to-peer Fundraising',
}: Step9PeerToPeerProps) {
  const { settings, isLoading, isSaving, loadError, reload, save } =
    usePeerToPeerSettings(campaignUniqueId);
  const isAlreadyEnabled = settings?.isPeerToPeerEnabled ?? false;

  // The completed-steps endpoint knows nothing about this step, so an existing opt-in is what marks
  // it done when the wizard is reopened.
  useEffect(() => {
    if (isAlreadyEnabled) {
      onStepComplete?.();
    }
  }, [isAlreadyEnabled, onStepComplete]);

  return (
    <Box maxW="100%" h="85%" overflowY="auto">
      <Text fontSize="32" mb="4">
        {stepTitle}
      </Text>

      {loadError && (
        <Alert status="error" borderRadius="12px" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <Text fontSize="sm">{loadError}</Text>
          </Box>
          <Button
            size="sm"
            variant="outline"
            minH="44px"
            onClick={reload}
            sx={{ cursor: 'pointer' }}
          >
            Try again
          </Button>
        </Alert>
      )}

      {isLoading && <PeerToPeerSettingsSkeleton />}

      {!isLoading && !loadError && settings && (
        <PeerToPeerStepForm
          settings={settings}
          isSaving={isSaving}
          isSubmitting={isSubmitting}
          save={save}
          onSaveAndNext={onSaveAndNext}
          onSkip={onSkip}
          onPrevStep={onPrevStep}
          onExit={onExit}
          onStepComplete={onStepComplete}
        />
      )}

      {(isLoading || loadError) && (
        <StepNavigationButtons
          onPrev={onPrevStep}
          onNext={onSkip}
          nextLabel="Skip For Now"
          isSubmitting={isSubmitting}
        />
      )}
    </Box>
  );
}
