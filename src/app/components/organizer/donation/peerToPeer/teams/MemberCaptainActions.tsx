import { Button, Stack } from '@chakra-ui/react';
import { CampaignTeamMember } from 'app/interface/donationInter/campaignTeamDto';
import { HAND_OVER_CAPTAINCY, REMOVE_MEMBER } from './teamCopy';

interface MemberCaptainActionsProps {
  member: CampaignTeamMember;
  isBusy: boolean;
  onRemove: () => void;
  onHandOver: () => void;
}

/**
 * What a captain can do to one member. Nothing is offered against themselves: leaving is how a captain
 * steps out, and removing yourself is refused by the server anyway.
 */
export const MemberCaptainActions = ({
  member,
  isBusy,
  onRemove,
  onHandOver,
}: MemberCaptainActionsProps) => {
  if (member.isCaptain) {
    return null;
  }

  return (
    <Stack direction={{ base: 'column', '2sm': 'row' }} gap={2} w={{ base: 'full', md: 'auto' }}>
      <Button
        onClick={onHandOver}
        variant="outline"
        colorScheme="purple"
        size="sm"
        minH="44px"
        borderRadius="12px"
        cursor={isBusy ? 'not-allowed' : 'pointer'}
        isDisabled={isBusy}
        w={{ base: 'full', '2sm': 'auto' }}
        aria-label={`${HAND_OVER_CAPTAINCY}: ${member.displayName}`}
      >
        {HAND_OVER_CAPTAINCY}
      </Button>

      <Button
        onClick={onRemove}
        variant="outline"
        colorScheme="red"
        size="sm"
        minH="44px"
        borderRadius="12px"
        cursor={isBusy ? 'not-allowed' : 'pointer'}
        isDisabled={isBusy}
        w={{ base: 'full', '2sm': 'auto' }}
        aria-label={`${REMOVE_MEMBER}: ${member.displayName}`}
      >
        {REMOVE_MEMBER}
      </Button>
    </Stack>
  );
};

export default MemberCaptainActions;
