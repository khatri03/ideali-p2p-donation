import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import { FundraiserStatus } from 'app/interface/donationInter/fundraiserConsoleDto';
import { ModerationAction } from 'app/interface/donationInter/peerToPeerModerationDto';
import {
  ACTION_LABELS,
  APPROVE_HINT,
  HIDE_PAGE_HINT,
  HIDE_TEAM_HINT,
  LET_BACK_IN_HINT,
  TAKE_DOWN_HINT,
  TAKE_DOWN_LABEL,
  TURN_DOWN_HINT,
  UNHIDE_PAGE_HINT,
  UNHIDE_TEAM_HINT,
} from './moderationCopy';

/**
 * How loudly one decision is presented. Two decisions that both take something off the site are not the
 * same decision: one is quiet and reversible, the other is told to the supporter and goes on the
 * record. Presenting them identically is what made them impossible to tell apart.
 */
type ModerationTone = 'primary' | 'caution' | 'danger';

/** One decision as it is offered: what it is called, what it does, and how much noise it makes. */
export interface ModerationChoice {
  action: ModerationAction;
  label: string;
  hint: string;
  tone: ModerationTone;
}

const TONE_PROPS: Record<ModerationTone, { colorScheme: string; variant: string }> = {
  primary: { colorScheme: 'brand', variant: 'solid' },
  caution: { colorScheme: 'gray', variant: 'outline' },
  danger: { colorScheme: 'red', variant: 'outline' },
};

/**
 * Which decisions a page is in a state to accept, and what each of them is called there. The server
 * holds the same table and refuses anything else; this one exists so a charity is never offered a
 * button that can only fail, and never offered one whose name does not match what it will do.
 */
export const fundraiserChoices = (status: FundraiserStatus): ModerationChoice[] => {
  const takeDown: ModerationChoice = {
    action: 'Reject',
    label: TAKE_DOWN_LABEL,
    hint: TAKE_DOWN_HINT,
    tone: 'danger',
  };

  switch (status) {
    case 'PendingApproval':
      return [
        { action: 'Approve', label: ACTION_LABELS.Approve, hint: APPROVE_HINT, tone: 'primary' },
        { action: 'Reject', label: ACTION_LABELS.Reject, hint: TURN_DOWN_HINT, tone: 'danger' },
      ];
    case 'Active':
      return [
        { action: 'Hide', label: ACTION_LABELS.Hide, hint: HIDE_PAGE_HINT, tone: 'caution' },
        takeDown,
      ];
    case 'Paused':
      return [
        { action: 'Unhide', label: ACTION_LABELS.Unhide, hint: UNHIDE_PAGE_HINT, tone: 'primary' },
        takeDown,
      ];
    default:
      return [
        { action: 'Approve', label: ACTION_LABELS.Approve, hint: LET_BACK_IN_HINT, tone: 'primary' },
      ];
  }
};

/** A team is never approved or turned down, so it only ever leaves and returns to browsing. */
export const teamChoices = (isHidden: boolean): ModerationChoice[] =>
  isHidden
    ? [{ action: 'Unhide', label: ACTION_LABELS.Unhide, hint: UNHIDE_TEAM_HINT, tone: 'primary' }]
    : [{ action: 'Hide', label: ACTION_LABELS.Hide, hint: HIDE_TEAM_HINT, tone: 'caution' }];

interface ModerationActionsBarProps {
  choices: ModerationChoice[];
  isBusy: boolean;
  onChoose: (action: ModerationAction) => void;
}

export const ModerationActionsBar = ({ choices, isBusy, onChoose }: ModerationActionsBarProps) => (
  <Flex gap={4} wrap="wrap" direction={{ base: 'column', '2sm': 'row' }} align="flex-start">
    {choices.map((choice) => (
      <Stack key={choice.action} gap={1} w={{ base: 'full', '2sm': 'auto' }} maxW="260px">
        <Button
          size="sm"
          minH="44px"
          w={{ base: 'full', '2sm': 'auto' }}
          {...TONE_PROPS[choice.tone]}
          isDisabled={isBusy}
          onClick={() => onChoose(choice.action)}
          sx={{ cursor: isBusy ? 'not-allowed' : 'pointer' }}
        >
          {choice.label}
        </Button>

        <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
          {choice.hint}
        </Text>
      </Stack>
    ))}
  </Flex>
);

export default ModerationActionsBar;
