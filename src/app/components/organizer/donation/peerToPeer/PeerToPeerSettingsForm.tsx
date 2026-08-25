import { Box, Button, Divider, Flex, Heading, Text } from '@chakra-ui/react';
import {
  PeerToPeerSettings,
  PeerToPeerSettingsDetail,
} from 'app/interface/donationInter/peerToPeerDto';
import PeerToPeerSettingsFields from './PeerToPeerSettingsFields';
import { usePeerToPeerSettingsForm } from './usePeerToPeerSettingsForm';

interface PeerToPeerSettingsFormProps {
  settings: PeerToPeerSettingsDetail;
  isSaving: boolean;
  onSave: (values: PeerToPeerSettings) => void;
  onRequestSwitchOff: (values: PeerToPeerSettings) => void;
}

export const PeerToPeerSettingsForm = ({
  settings,
  isSaving,
  onSave,
  onRequestSwitchOff,
}: PeerToPeerSettingsFormProps) => {
  const form = usePeerToPeerSettingsForm(settings, isSaving);

  const handleSubmit = () => {
    if (!form.validate()) {
      return;
    }

    const values = form.buildValues();

    if (form.isSwitchingOff()) {
      onRequestSwitchOff(values);
      return;
    }

    onSave(values);
  };

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      p={{ base: 4, md: 6 }}
      boxShadow="sm"
    >
      <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }} mb={1}>
        Supporter fundraising
      </Heading>
      <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }} maxW="70ch">
        Let your supporters raise money for this campaign on their own pages, with their own goal and
        their own story. Every donation still reaches this campaign and your payment account.
      </Text>

      <PeerToPeerSettingsFields settings={settings} form={form} isSaving={isSaving} />

      <Divider mb={5} />

      <Flex justify={{ base: 'stretch', md: 'flex-end' }}>
        <Button
          colorScheme="brand"
          w={{ base: 'full', md: 'auto' }}
          minH="44px"
          isDisabled={isSaving || form.isSwitchLocked}
          isLoading={isSaving}
          loadingText="Saving..."
          onClick={handleSubmit}
          sx={{ cursor: isSaving || form.isSwitchLocked ? 'not-allowed' : 'pointer' }}
        >
          Save changes
        </Button>
      </Flex>
    </Box>
  );
};

export default PeerToPeerSettingsForm;
