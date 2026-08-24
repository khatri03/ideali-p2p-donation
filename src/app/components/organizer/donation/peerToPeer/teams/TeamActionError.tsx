import { Alert, AlertDescription, AlertIcon, CloseButton } from '@chakra-ui/react';

interface TeamActionErrorProps {
  message: string;
  onDismiss: () => void;
}

/**
 * What the server said when it refused a team action, shown in one place so a refusal is never a silent
 * no-op. The sentence comes from the API and is already written for a person; nothing is added to it.
 */
export const TeamActionError = ({ message, onDismiss }: TeamActionErrorProps) => (
  <Alert status="error" borderRadius="12px" alignItems="flex-start">
    <AlertIcon />
    <AlertDescription fontSize={{ base: 'sm', md: 'md' }} flex="1">
      {message}
    </AlertDescription>
    <CloseButton onClick={onDismiss} cursor="pointer" minH="44px" minW="44px" />
  </Alert>
);

export default TeamActionError;
