import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { InvitationSendResult } from 'app/interface/donationInter/fundraiserInvitationDto';
import {
  ADDRESSES_HELP,
  ADDRESSES_LABEL,
  ADDRESSES_PLACEHOLDER,
  COMPOSE_HEADING,
  COMPOSE_NOTE,
  MESSAGE_LIMIT,
  PERSONAL_MESSAGE_LABEL,
  PERSONAL_MESSAGE_PLACEHOLDER,
  PREVIEW_LABEL,
  SENDING_LABEL,
  SEND_LABEL,
} from './invitationCopy';
import InvitationPreviewDialog from './InvitationPreviewDialog';
import SupporterPicker from './SupporterPicker';
import useInvitationComposer from './useInvitationComposer';

interface InvitationComposerProps {
  campaignUniqueId: string;
  onSent: (result: InvitationSendResult) => void;
}

export const InvitationComposer = ({ campaignUniqueId, onSent }: InvitationComposerProps) => {
  const composer = useInvitationComposer(campaignUniqueId);
  const hasAddresses = composer.parsedAddresses.length > 0;

  const handleSend = async () => {
    const result = await composer.send();

    if (result) {
      onSent(result);
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="secondaryGray.300"
      borderRadius="16px"
      p={{ base: 4, md: 6 }}
    >
      <Stack gap={4}>
        <Stack gap={1}>
          <Heading as="h2" fontSize={{ base: 'md', md: 'lg' }}>
            {COMPOSE_HEADING}
          </Heading>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {COMPOSE_NOTE}
          </Text>
        </Stack>

        <FormControl isInvalid={composer.error !== null}>
          <FormLabel fontSize="sm" htmlFor="invitation-addresses">
            {ADDRESSES_LABEL}
          </FormLabel>
          <Textarea
            id="invitation-addresses"
            value={composer.addresses}
            rows={3}
            placeholder={ADDRESSES_PLACEHOLDER}
            onChange={(event) => composer.setAddresses(event.target.value)}
          />
          {composer.error ? (
            <FormErrorMessage fontSize="sm">{composer.error}</FormErrorMessage>
          ) : (
            <FormHelperText fontSize="sm">
              {ADDRESSES_HELP}
              {hasAddresses && ` ${composer.parsedAddresses.length} so far.`}
            </FormHelperText>
          )}
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" htmlFor="invitation-message">
            {PERSONAL_MESSAGE_LABEL}
          </FormLabel>
          <Textarea
            id="invitation-message"
            value={composer.personalMessage}
            rows={4}
            maxLength={MESSAGE_LIMIT}
            placeholder={PERSONAL_MESSAGE_PLACEHOLDER}
            onChange={(event) => composer.setPersonalMessage(event.target.value)}
          />
          <FormHelperText fontSize="sm">
            {composer.personalMessage.length} of {MESSAGE_LIMIT} characters
          </FormHelperText>
        </FormControl>

        <SupporterPicker campaignUniqueId={campaignUniqueId} onPick={composer.addAddress} />

        <Flex gap={3} wrap="wrap" direction={{ base: 'column', md: 'row' }}>
          <Button
            colorScheme="brand"
            minH="44px"
            w={{ base: 'full', md: 'auto' }}
            isDisabled={composer.isSending || !hasAddresses}
            isLoading={composer.isSending}
            loadingText={SENDING_LABEL}
            onClick={handleSend}
            sx={{ cursor: composer.isSending || !hasAddresses ? 'not-allowed' : 'pointer' }}
          >
            {SEND_LABEL}
          </Button>
          <Button
            variant="outline"
            minH="44px"
            w={{ base: 'full', md: 'auto' }}
            isDisabled={composer.isPreviewing}
            isLoading={composer.isPreviewing}
            loadingText="Preparing..."
            onClick={composer.openPreview}
            sx={{ cursor: composer.isPreviewing ? 'not-allowed' : 'pointer' }}
          >
            {PREVIEW_LABEL}
          </Button>
        </Flex>
      </Stack>

      <InvitationPreviewDialog preview={composer.preview} onClose={composer.closePreview} />
    </Box>
  );
};

export default InvitationComposer;
