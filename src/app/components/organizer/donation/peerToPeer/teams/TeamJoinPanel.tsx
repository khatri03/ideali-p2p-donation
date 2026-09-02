import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import {
  GO_TO_MY_TEAM,
  JOIN_INVITE,
  JOIN_LABEL,
  JOIN_NOT_FUNDRAISER,
  JOIN_TEAMS_OFF,
  SET_UP_MY_PAGE,
  joinBlockedByOtherTeam,
} from './teamCopy';

interface TeamJoinPanelProps {
  team: CampaignTeamPage;
  onJoin: () => void;
  onSetUpMyPage: () => void;
  onGoToMyTeam: (teamSlug: string) => void;
}

/**
 * The answer to the question somebody arrives at a team's own address holding: can I be part of this.
 *
 * A team page is what a captain shares to recruit, so it has to serve the person who follows that link.
 * Every reason they cannot join is said here with the step that clears it, rather than leaving them to
 * find the browse screen and hunt for the team already in front of them.
 *
 * Shown only to somebody who is not in this team. What the panel offers is presentation: joining is
 * authorised again on the way in, and a page rendered from a tampered payload buys a control the server
 * refuses.
 */
export const TeamJoinPanel = ({
  team,
  onJoin,
  onSetUpMyPage,
  onGoToMyTeam,
}: TeamJoinPanelProps) => {
  if (team.viewerRole !== 'Visitor' || !team.isCampaignOpen) {
    return null;
  }

  const { guidance, action } = describeJoin(team, onJoin, onSetUpMyPage, onGoToMyTeam);

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
    >
      <Stack
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={4}
      >
        <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.700" _dark={{ color: 'gray.200' }}>
          {guidance}
        </Text>

        {action && (
          <Button
            onClick={action.onPress}
            colorScheme="brand"
            variant={action.isPrimary ? 'solid' : 'outline'}
            minH="44px"
            borderRadius="12px"
            cursor="pointer"
            flexShrink={0}
            w={{ base: 'full', md: 'auto' }}
          >
            {action.label}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

interface JoinOffer {
  guidance: string;
  action: { label: string; onPress: () => void; isPrimary: boolean } | null;
}

/**
 * Ordered by what the reader can do about it. Teams being switched off is the charity's decision and
 * nothing clears it, so it is answered first and offers nothing; the two remaining reasons are both
 * things the reader can act on.
 */
const describeJoin = (
  team: CampaignTeamPage,
  onJoin: () => void,
  onSetUpMyPage: () => void,
  onGoToMyTeam: (teamSlug: string) => void,
): JoinOffer => {
  if (!team.areTeamsAllowed) {
    return { guidance: JOIN_TEAMS_OFF, action: null };
  }

  if (!team.isFundraiser) {
    return {
      guidance: JOIN_NOT_FUNDRAISER,
      action: { label: SET_UP_MY_PAGE, onPress: onSetUpMyPage, isPrimary: false },
    };
  }

  if (team.myTeamSlug) {
    return {
      guidance: joinBlockedByOtherTeam(team.organizerName),
      action: {
        label: GO_TO_MY_TEAM,
        onPress: () => onGoToMyTeam(team.myTeamSlug),
        isPrimary: false,
      },
    };
  }

  return {
    guidance: JOIN_INVITE,
    action: { label: JOIN_LABEL, onPress: onJoin, isPrimary: true },
  };
};

export default TeamJoinPanel;
