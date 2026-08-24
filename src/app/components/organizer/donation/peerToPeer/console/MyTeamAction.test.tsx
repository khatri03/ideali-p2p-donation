import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { buildMyFundraisingPage } from '../peerToPeerTestFactory';
import MyTeamAction from './MyTeamAction';

const renderAction = (page: MyFundraisingPage) => {
  const onOpen = vi.fn();

  render(
    <ChakraProvider>
      <MyTeamAction page={page} onOpen={onOpen} />
    </ChakraProvider>,
  );

  return onOpen;
};

describe('MyTeamAction', () => {
  it('Console_CampaignFormingTeams_OffersTheWayIntoTheTeamsScreen', async () => {
    const onOpen = renderAction(buildMyFundraisingPage({ areTeamsAllowed: true, myTeam: null }));

    await userEvent.click(screen.getByRole('button', { name: 'Find a team' }));

    expect(onOpen).toHaveBeenCalledWith('/campaigns/winter-appeal/teams');
  });

  it('Console_FundraiserInATeam_NamesItAndGoesStraightToIt', async () => {
    const onOpen = renderAction(
      buildMyFundraisingPage({
        areTeamsAllowed: true,
        myTeam: { slug: 'night-runners', name: 'Night Runners' },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'My team: Night Runners' }));

    expect(onOpen).toHaveBeenCalledWith('/campaigns/winter-appeal/teams/night-runners');
  });

  it('Console_TeamsSwitchedOff_OffersNothingRatherThanAControlThatWouldRefuse', () => {
    renderAction(buildMyFundraisingPage({ areTeamsAllowed: false, myTeam: null }));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('Console_TeamsSwitchedOffAfterJoining_StillReachesTheTeamAlreadyJoined', () => {
    renderAction(
      buildMyFundraisingPage({
        areTeamsAllowed: false,
        myTeam: { slug: 'night-runners', name: 'Night Runners' },
      }),
    );

    expect(screen.getByRole('button', { name: 'My team: Night Runners' })).toBeInTheDocument();
  });

  it('Console_CampaignWithNoPublicAddress_OffersNoTeamLinkThatCouldNotResolve', () => {
    renderAction(
      buildMyFundraisingPage({ campaignSlug: null, areTeamsAllowed: true, myTeam: null }),
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('Console_TeamAction_IsATouchTargetWithAPointerCursor', () => {
    renderAction(buildMyFundraisingPage({ areTeamsAllowed: true, myTeam: null }));

    const action = screen.getByRole('button', { name: 'Find a team' });

    expect(action).toHaveStyle({ minHeight: '44px', cursor: 'pointer' });
  });
});
