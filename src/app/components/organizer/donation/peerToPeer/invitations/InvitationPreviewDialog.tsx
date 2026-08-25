import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { InvitationPreview } from 'app/interface/donationInter/fundraiserInvitationDto';
import { CLOSE_LABEL, PREVIEW_FRAME_TITLE, PREVIEW_HEADING, PREVIEW_NOTE } from './invitationCopy';

interface InvitationPreviewDialogProps {
  preview: InvitationPreview | null;
  onClose: () => void;
}

/**
 * The email is shown in a sandboxed frame rather than injected into this page. The body is built by
 * the server and already encoded, and rendering it inside the application would still put whatever it
 * contains in this document's origin — a frame with no permissions cannot reach anything if it is wrong.
 */
export const InvitationPreviewDialog = ({ preview, onClose }: InvitationPreviewDialogProps) => (
  <Modal isOpen={preview !== null} onClose={onClose} size={{ base: 'full', md: 'xl' }} isCentered>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader fontSize={{ base: 'md', md: 'lg' }}>{PREVIEW_HEADING}</ModalHeader>
      <ModalCloseButton aria-label="Close preview" minH="44px" minW="44px" sx={{ cursor: 'pointer' }} />
      <ModalBody>
        <Stack gap={3}>
          <Text fontSize="sm" color="secondaryGray.600">
            {PREVIEW_NOTE}
          </Text>
          <Box>
            <Text fontSize="xs" color="secondaryGray.600" textTransform="uppercase">
              Subject
            </Text>
            <Text fontSize="sm" fontWeight="700">
              {preview?.subject}
            </Text>
          </Box>
          <Box
            as="iframe"
            title={PREVIEW_FRAME_TITLE}
            sandbox=""
            srcDoc={preview?.bodyHtml ?? ''}
            w="100%"
            h={{ base: '60vh', md: '420px' }}
            borderWidth="1px"
            borderColor="secondaryGray.300"
            borderRadius="12px"
            bg="white"
          />
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          minH="44px"
          w={{ base: 'full', md: 'auto' }}
          onClick={onClose}
          sx={{ cursor: 'pointer' }}
        >
          {CLOSE_LABEL}
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default InvitationPreviewDialog;
