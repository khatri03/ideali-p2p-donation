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

const inTeam = (name = 'Night Runners') =>
  buildMyFundraisingPage({
    areTeamsAllowed: true,
    myTeam: { slug: 'night-runners', name },
  });

describe('MyTeamAction', () => {
  /**
   * A campaign forming teams has to say so from the one screen a fundraiser returns to, or the teams
   * screens exist and nothing leads to them.
   */
  it('Console_CampaignFormingTeams_OffersTheWayIntoTheTeamsScreen', async () => {
    const onOpen = renderAction(buildMyFundraisingPage({ areTeamsAllowed: true, myTeam: null }));

    await userEvent.click(screen.getByRole('button', { name: 'Find a team' }));

    expect(onOpen).toHaveBeenCalledWith('/campaigns/winter-appeal/teams');
  });

  /**
   * Being in a team is a fact about the person, not an action. Stating it as one and putting the
   * action beside it is what stops a control announcing a status while giving no clue what it does.
   */
  it('Console_FundraiserInATeam_NamesTheTeamAndOffersAnActionThatSaysWhatItDoes', () => {
    renderAction(inTeam());

    expect(screen.getByText('Your team')).toBeInTheDocument();
    expect(screen.getByText('Night Runners')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /My team:/ })).not.toBeInTheDocument();
  });

  it('Console_TeamActionPressed_GoesStraightToThatTeam', async () => {
    const onOpen = renderAction(inTeam());

    await userEvent.click(screen.getByRole('button', { name: 'View team Night Runners' }));

    expect(onOpen).toHaveBeenCalledWith('/campaigns/winter-appeal/teams/night-runners');
  });

  /**
   * A console lists every campaign a person fundraises for, so several of these can sit on one screen.
   * The spoken name carries the team; a row of buttons all called "View team" tells a screen-reader
   * user nothing about which one they are on.
   */
  it('Console_TeamAction_IsSpokenWithTheTeamItOpens', () => {
    renderAction(inTeam());

    const action = screen.getByRole('button', { name: 'View team Night Runners' });

    expect(action).toHaveTextContent('View team');
  });

  /**
   * A team may be named with all eighty characters the form allows. The name is given one line and its
   * own tooltip so it can never decide the width of the card it sits in.
   */
  it('Console_TeamNamedAtFullLength_KeepsItToOneLineAndStillShowsItInFull', () => {
    const longName = 'T'.repeat(80);

    renderAction(inTeam(longName));

    const name = screen.getByText(longName);

    expect(name).toHaveAttribute('title', longName);
    expect(window.getComputedStyle(name).getPropertyValue('--chakra-line-clamp')).toBe('1');
  });

  /**
   * A gap where a control used to be is something the fundraiser has to interpret. Saying it plainly
   * stops them hunting for a teams screen this campaign never opened.
   */
  it('Console_TeamsSwitchedOff_SaysSoRatherThanLeavingAGap', () => {
    renderAction(buildMyFundraisingPage({ areTeamsAllowed: false, myTeam: null }));

    expect(screen.getByText('This campaign is not running teams.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  /**
   * Switching teams off stops new teams and new joins. It does not strand somebody inside the team
   * they already belong to.
   */
  it('Console_TeamsSwitchedOffAfterJoining_StillReachesTheTeamAlreadyJoined', () => {
    renderAction(
      buildMyFundraisingPage({
        areTeamsAllowed: false,
        myTeam: { slug: 'night-runners', name: 'Night Runners' },
      }),
    );

    expect(screen.getByRole('button', { name: 'View team Night Runners' })).toBeInTheDocument();
  });

  /**
   * Every team address is built from the campaign's public address. Without one there is no
   * destination, and a control that could only refuse the person who pressed it is worse than none.
   */
  it('Console_CampaignWithNoPublicAddress_OffersNoTeamLinkThatCouldNotResolve', () => {
    renderAction(
      buildMyFundraisingPage({ campaignSlug: null, areTeamsAllowed: true, myTeam: null }),
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Your team')).not.toBeInTheDocument();
  });

  it('Console_TeamAction_IsATouchTargetWithAPointerCursor', () => {
    renderAction(buildMyFundraisingPage({ areTeamsAllowed: true, myTeam: null }));

    const action = screen.getByRole('button', { name: 'Find a team' });

    expect(action).toHaveStyle({ minHeight: '44px', cursor: 'pointer' });
  });

  it('Console_TeamActionForAJoinedTeam_IsAlsoATouchTargetWithAPointerCursor', () => {
    renderAction(inTeam());

    const action = screen.getByRole('button', { name: 'View team Night Runners' });

    expect(action).toHaveStyle({ minHeight: '44px', cursor: 'pointer' });
  });
});
