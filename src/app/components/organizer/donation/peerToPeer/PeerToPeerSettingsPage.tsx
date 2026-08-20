import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  Heading,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { MdArrowBack } from 'react-icons/md';
import ConfirmationModal from 'app/components/common/ConfirmationModal';
import { PeerToPeerSettings } from 'app/interface/donationInter/peerToPeerDto';
import {
  SWITCH_OFF_CANCEL,
  SWITCH_OFF_CONFIRM,
  SWITCH_OFF_TITLE,
  switchOffMessage,
} from './peerToPeerCopy';
import PeerToPeerSettingsForm from './PeerToPeerSettingsForm';
import PeerToPeerSettingsSkeleton from './PeerToPeerSettingsSkeleton';
import { usePeerToPeerSettings } from './usePeerToPeerSettings';

export const PeerToPeerSettingsPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const navigate = useNavigate();
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
    <Box maxW="1000px" mx="auto" px={{ base: 4, md: 6 }} pt={{ base: '100px', md: '80px' }} pb={10}>
      <Stack gap={4}>
        <Flex align={{ base: 'stretch', md: 'center' }} gap={3} wrap="wrap">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<MdArrowBack />}
            minH="44px"
            alignSelf={{ base: 'flex-start', md: 'center' }}
            onClick={() => navigate(-1)}
            sx={{ cursor: 'pointer' }}
          >
            Back
          </Button>
          <Stack gap={1} minW={0}>
            <Heading as="h1" fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}>
              Peer-to-peer fundraising
            </Heading>
            {isLoading ? (
              <Skeleton height="18px" width={{ base: '60%', md: '240px' }} borderRadius="md" />
            ) : (
              settings?.campaignName && (
                <Text fontSize={{ base: 'sm', md: 'md' }} color="secondaryGray.600">
                  Campaign:{' '}
                  <Text
                    as="span"
                    fontWeight="600"
                    color="secondaryGray.900"
                    _dark={{ color: 'white' }}
                  >
                    {settings.campaignName}
                  </Text>
                </Text>
              )
            )}
          </Stack>
        </Flex>

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
    </Box>
  );
};

export default PeerToPeerSettingsPage;
