import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import ConfirmationModal from 'app/components/common/ConfirmationModal';
import { PeerToPeerSettings } from 'app/interface/donationInter/peerToPeerDto';
import {
  SWITCH_OFF_CANCEL,
  SWITCH_OFF_CONFIRM,
  SWITCH_OFF_TITLE,
  switchOffMessage,
} from './peerToPeerCopy';
import ModerationShell from './moderation/ModerationShell';
import PeerToPeerSettingsForm from './PeerToPeerSettingsForm';
import PeerToPeerSettingsSkeleton from './PeerToPeerSettingsSkeleton';
import { usePeerToPeerSettings } from './usePeerToPeerSettings';

export const PeerToPeerSettingsPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const toast = useToast();
  const confirmation = useDisclosure();
  const [pendingValues, setPendingValues] = useState<PeerToPeerSettings | null>(null);

  const { settings, isLoading, isSaving, loadError, reload, save } =
    usePeerToPeerSettings(campaignUniqueId ?? '');

  const commit = async (values: PeerToPeerSettings) => {
    const failure = await save(values);

    if (failure) {
      toast({
        title: 'Not saved',
        description: failure,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: 'Settings saved',
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
  };

  const handleRequestSwitchOff = (values: PeerToPeerSettings) => {
    setPendingValues(values);
    confirmation.onOpen();
  };

  const handleConfirmSwitchOff = async () => {
    if (!pendingValues) {
      return;
    }

    const values = pendingValues;
    confirmation.onClose();
    setPendingValues(null);
    await commit(values);
  };

  return (
    <ModerationShell
      campaignUniqueId={campaignUniqueId ?? ''}
      campaignName={settings?.campaignName}
      heading="P2P fundraising"
    >
      <Stack gap={4}>
        {loadError && (
          <Alert status="error" borderRadius="12px">
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
          <PeerToPeerSettingsForm
            settings={settings}
            isSaving={isSaving}
            onSave={commit}
            onRequestSwitchOff={handleRequestSwitchOff}
          />
        )}
      </Stack>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => {
          confirmation.onClose();
          setPendingValues(null);
        }}
        onConfirm={handleConfirmSwitchOff}
        title={SWITCH_OFF_TITLE}
        message={switchOffMessage(settings?.liveFundraiserCount ?? 0)}
        confirmText={SWITCH_OFF_CONFIRM}
        cancelText={SWITCH_OFF_CANCEL}
        type="warning"
        isLoading={isSaving}
      />
    </ModerationShell>
  );
};

export default PeerToPeerSettingsPage;
