import { Button, Text } from '@chakra-ui/react';

interface PanelSwitchPromptProps {
  prompt: string;
  action: string;
  onSwitch: () => void;
}

/**
 * The line at the foot of each panel that sends a visitor to the other one. It moves the open tab
 * rather than navigating, so a half-typed address is the only thing they lose.
 */
export const PanelSwitchPrompt = ({ prompt, action, onSwitch }: PanelSwitchPromptProps) => (
  <Text textAlign="center" fontSize="sm" color="secondaryGray.600">
    {prompt}{' '}
    <Button
      variant="link"
      colorScheme="brand"
      fontSize="sm"
      fontWeight="600"
      minH="44px"
      onClick={onSwitch}
      sx={{ cursor: 'pointer' }}
    >
      {action}
    </Button>
  </Text>
);

export default PanelSwitchPrompt;
