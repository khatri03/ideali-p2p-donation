import { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Stack,
  Text,
} from '@chakra-ui/react';
import { CANCEL_LABEL } from './teamCopy';

interface ConfirmActionDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  /** An extra sentence for the cases that change more than the obvious, such as closing the team. */
  warning?: string;
  confirmLabel: string;
  busyLabel: string;
  isBusy: boolean;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The one confirmation surface behind joining, leaving, removing a member and handing over the
 * captaincy. Each of those changes what somebody else sees, so every one of them explains what happens
 * to money already raised before it asks. One component so those sentences cannot drift apart.
 */
export const ConfirmActionDialog = ({
  isOpen,
  title,
  body,
  warning,
  confirmLabel,
  busyLabel,
  isBusy,
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) => {
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
            <Stack gap={3}>
              <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
                {body}
              </Text>

              {warning && (
                <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="600" color="orange.500">
                  {warning}
                </Text>
              )}
            </Stack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Stack
              direction={{ base: 'column-reverse', md: 'row' }}
              gap={3}
              w="full"
              justify={{ md: 'flex-end' }}
            >
              <Button
                ref={cancelRef}
                onClick={onCancel}
                variant="outline"
                minH="44px"
                borderRadius="12px"
                cursor={isBusy ? 'not-allowed' : 'pointer'}
                isDisabled={isBusy}
                w={{ base: 'full', md: 'auto' }}
              >
                {CANCEL_LABEL}
              </Button>

              <Button
                onClick={onConfirm}
                colorScheme={isDestructive ? 'red' : 'brand'}
                minH="44px"
                borderRadius="12px"
                cursor={isBusy ? 'not-allowed' : 'pointer'}
                isDisabled={isBusy}
                isLoading={isBusy}
                loadingText={busyLabel}
                w={{ base: 'full', md: 'auto' }}
              >
                {confirmLabel}
              </Button>
            </Stack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ConfirmActionDialog;
