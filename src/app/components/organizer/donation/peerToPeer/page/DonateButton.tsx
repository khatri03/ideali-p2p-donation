import { Button } from '@chakra-ui/react';

interface DonateButtonProps {
  label: string;
  onClick: () => void;
  isDisabled?: boolean;
}

/**
 * The one action a public fundraising or team page exists for.
 *
 * Chakra keeps a button's label on a single line, so a label carrying a name a supporter chose would
 * run out of the panel and be cut off at both edges. This one wraps instead and grows downwards, and
 * breaks inside a word only when a single word is itself wider than the panel, which is the only case
 * where wrapping alone cannot help.
 */
export const DonateButton = ({ label, onClick, isDisabled }: DonateButtonProps) => (
  <Button
    onClick={onClick}
    colorScheme="purple"
    size="lg"
    w="full"
    h="auto"
    minH="48px"
    py={3}
    borderRadius="12px"
    cursor={isDisabled ? 'not-allowed' : 'pointer'}
    isDisabled={isDisabled}
    whiteSpace="normal"
    textAlign="center"
    wordBreak="break-word"
    lineHeight="1.3"
  >
    {label}
  </Button>
);

export default DonateButton;
