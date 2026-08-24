import { Button } from '@chakra-ui/react';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { browseTeamsPath, teamPagePath } from '../teams/teamPaths';
import { FIND_A_TEAM, myTeamLabel } from './consoleCopy';

interface MyTeamActionProps {
  page: MyFundraisingPage;
  onOpen: (path: string) => void;
}

/**
 * The way from a fundraiser's own console into the team surface, which is otherwise reachable only by
 * typing its address. A team the fundraiser is already in stays reachable after the charity switches
 * teams off, because switching them off stops new teams and new joins rather than hiding the one they
 * are in. Nothing is offered on a campaign with no public address, or on one that is not forming teams:
 * a control that only refuses the person who presses it is worse than no control.
 */
export const MyTeamAction = ({ page, onOpen }: MyTeamActionProps) => {
  if (!page.campaignSlug) {
    return null;
  }

  if (page.myTeam) {
    return (
      <Button
        onClick={() => onOpen(teamPagePath(page.campaignSlug, page.myTeam.slug))}
        variant="outline"
        colorScheme="brand"
        minH="44px"
        borderRadius="12px"
        cursor="pointer"
        w={{ base: 'full', md: 'auto' }}
      >
        {myTeamLabel(page.myTeam.name)}
      </Button>
    );
  }

  if (!page.areTeamsAllowed) {
    return null;
  }

  return (
    <Button
      onClick={() => onOpen(browseTeamsPath(page.campaignSlug))}
      variant="outline"
      colorScheme="brand"
      minH="44px"
      borderRadius="12px"
      cursor="pointer"
      w={{ base: 'full', md: 'auto' }}
    >
      {FIND_A_TEAM}
    </Button>
  );
};

export default MyTeamAction;
