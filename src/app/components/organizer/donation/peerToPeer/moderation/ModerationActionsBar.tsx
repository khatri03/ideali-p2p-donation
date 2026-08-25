import { Button, Flex } from '@chakra-ui/react';
import { FundraiserStatus } from 'app/interface/donationInter/fundraiserConsoleDto';
import { ModerationAction } from 'app/interface/donationInter/peerToPeerModerationDto';
import { ACTION_LABELS } from './moderationCopy';

/**
 * Which decisions a page is in a state to accept. The server holds the same table and refuses anything
 * else; this one exists so a charity is never offered a button that can only fail.
 */
export const fundraiserActionsFor = (status: FundraiserStatus): ModerationAction[] => {
  switch (status) {
    case 'PendingApproval':
      return ['Approve', 'Reject'];
    case 'Active':
      return ['Hide', 'Reject'];
    case 'Paused':
      return ['Unhide', 'Reject'];
    default:
      return ['Approve'];
  }
};

export const teamActionsFor = (isHidden: boolean): ModerationAction[] =>
  isHidden ? ['Unhide'] : ['Hide'];

const DESTRUCTIVE: ModerationAction[] = ['Hide', 'Reject'];

interface ModerationActionsBarProps {
  actions: ModerationAction[];
  isBusy: boolean;
  onChoose: (action: ModerationAction) => void;
}

export const ModerationActionsBar = ({
  actions,
  isBusy,
  onChoose,
}: ModerationActionsBarProps) => (
  <Flex gap={2} wrap="wrap" direction={{ base: 'column', '2sm': 'row' }}>
    {actions.map((action) => (
      <Button
        key={action}
        size="sm"
        minH="44px"
        w={{ base: 'full', '2sm': 'auto' }}
        colorScheme={DESTRUCTIVE.includes(action) ? 'red' : 'brand'}
        variant={DESTRUCTIVE.includes(action) ? 'outline' : 'solid'}
        isDisabled={isBusy}
        onClick={() => onChoose(action)}
        sx={{ cursor: isBusy ? 'not-allowed' : 'pointer' }}
      >
        {ACTION_LABELS[action]}
      </Button>
    ))}
  </Flex>
);

export default ModerationActionsBar;
