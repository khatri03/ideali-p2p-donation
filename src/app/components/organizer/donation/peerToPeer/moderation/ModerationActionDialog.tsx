import { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  CANCEL_LABEL,
  REASON_HELP,
  REASON_LABEL,
  reasonRemaining,
} from './moderationCopy';

interface ModerationActionDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  busyLabel: string;
  isDestructive: boolean;
  isBusy: boolean;
  reason: string;
  reasonError: string | null;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The one surface behind all four decisions. It stays open until the server answers, so a charity is
 * never left guessing whether the change went through, and it says what happens to money already raised
 * before it asks.
 */
export const ModerationActionDialog = ({
  isOpen,
  title,
  body,
  confirmLabel,
  busyLabel,
  isDestructive,
  isBusy,
  reason,
  reasonError,
  onReasonChange,
  onConfirm,
  onCancel,
}: ModerationActionDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onCancel}
      isCentered
      size={{ base: 'full', md: 'md' }}
    >
      <AlertDialogOverlay>
        <AlertDialogContent borderRadius={{ base: 0, md: '16px' }} mx={{ md: 4 }}>
          <AlertDialogHeader fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700">
            {title}
          </AlertDialogHeader>
          <AlertDialogBody>
            <Stack gap={4}>
              <Text fontSize={{ base: 'sm', md: 'md' }}>{body}</Text>
              <FormControl isInvalid={Boolean(reasonError)}>
                <FormLabel fontSize="sm" mb={1}>
                  {REASON_LABEL}
                </FormLabel>
                <Textarea
                  value={reason}
                  onChange={(event) => onReasonChange(event.target.value)}
                  isDisabled={isBusy}
                  rows={3}
                  borderRadius="12px"
                  sx={{ cursor: isBusy ? 'not-allowed' : 'text' }}
                />
                {reasonError ? (
                  <FormErrorMessage fontSize="xs">{reasonError}</FormErrorMessage>
                ) : (
                  <FormHelperText fontSize="xs">
                    {REASON_HELP} {reasonRemaining(reason.length)}
                  </FormHelperText>
                )}
              </FormControl>
            </Stack>
          </AlertDialogBody>
          <AlertDialogFooter gap={2} flexDirection={{ base: 'column-reverse', md: 'row' }}>
            <Button
              ref={cancelRef}
              onClick={onCancel}
              variant="ghost"
              minH="44px"
              w={{ base: 'full', md: 'auto' }}
              isDisabled={isBusy}
              sx={{ cursor: isBusy ? 'not-allowed' : 'pointer' }}
            >
              {CANCEL_LABEL}
            </Button>
            <Button
              colorScheme={isDestructive ? 'red' : 'brand'}
              onClick={onConfirm}
              minH="44px"
              w={{ base: 'full', md: 'auto' }}
              isDisabled={isBusy || Boolean(reasonError)}
              isLoading={isBusy}
              loadingText={busyLabel}
              sx={{ cursor: isBusy || reasonError ? 'not-allowed' : 'pointer' }}
            >
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ModerationActionDialog;
