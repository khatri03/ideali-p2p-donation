import { Button, Stack, Text } from '@chakra-ui/react';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { browseTeamsPath, teamPagePath } from '../teams/teamPaths';
import {
  FIND_A_TEAM,
  TEAMS_NOT_RUNNING,
  VIEW_TEAM,
  YOUR_TEAM_LABEL,
  viewTeamLabel,
} from './consoleCopy';

interface MyTeamActionProps {
  page: MyFundraisingPage;
  onOpen: (path: string) => void;
}

/**
 * Where a fundraiser's own console meets the team surface, which is otherwise reachable only by typing
 * its address.
 *
 * Being in a team is a fact about the person, not an action, so it is stated as one: the team is named
 * under a label, and the button beside it says what pressing it does. Putting the name inside the
 * button made a control that announced a status and gave no clue what it would do, and a name of the
 * full eighty characters a team may carry stretched it past every other control in the row.
 *
 * A team already joined stays reachable after the charity switches teams off, because switching them
 * off stops new teams and new joins rather than hiding the one somebody is already in. A campaign not
 * forming teams says so rather than leaving a gap the fundraiser has to interpret. A campaign with no
 * public address offers nothing at all: every team address is built from that address, so there is no
 * destination to offer.
 */
export const MyTeamAction = ({ page, onOpen }: MyTeamActionProps) => {
  if (!page.campaignSlug) {
    return null;
  }

  if (page.myTeam) {
    return (
      <Stack
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        gap={3}
        minW={0}
      >
        {/* The name is allowed one line and carries its own tooltip, so an eighty-character team name
            cannot decide the width of this row. */}
        <Stack gap={0} minW={0} flex="1">
          <Text
            fontSize="xs"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wide"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
          >
            {YOUR_TEAM_LABEL}
          </Text>
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight="700"
            noOfLines={1}
            title={page.myTeam.name}
          >
            {page.myTeam.name}
          </Text>
        </Stack>

        <Button
          onClick={() => onOpen(teamPagePath(page.campaignSlug, page.myTeam.slug))}
          aria-label={viewTeamLabel(page.myTeam.name)}
          variant="outline"
          colorScheme="brand"
          minH="44px"
          borderRadius="12px"
          cursor="pointer"
          flexShrink={0}
          w={{ base: 'full', md: 'auto' }}
        >
          {VIEW_TEAM}
        </Button>
      </Stack>
    );
  }

  if (!page.areTeamsAllowed) {
    return (
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
        {TEAMS_NOT_RUNNING}
      </Text>
    );
  }

  return (
    <Button
      onClick={() => onOpen(browseTeamsPath(page.campaignSlug))}
      variant="outline"
      colorScheme="brand"
      minH="44px"
      borderRadius="12px"
      cursor="pointer"
      alignSelf={{ base: 'stretch', md: 'flex-start' }}
      w={{ base: 'full', md: 'auto' }}
    >
      {FIND_A_TEAM}
    </Button>
  );
};

export default MyTeamAction;
