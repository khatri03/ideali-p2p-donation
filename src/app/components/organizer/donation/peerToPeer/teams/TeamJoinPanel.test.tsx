import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import { buildTeamPage } from '../peerToPeerTestFactory';
import TeamJoinPanel from './TeamJoinPanel';

const renderPanel = (overrides: Partial<CampaignTeamPage> = {}) => {
  const onJoin = vi.fn();
  const onSetUpMyPage = vi.fn();
  const onGoToMyTeam = vi.fn();

  render(
    <ChakraProvider>
      <TeamJoinPanel
        team={buildTeamPage(overrides)}
        onJoin={onJoin}
        onSetUpMyPage={onSetUpMyPage}
        onGoToMyTeam={onGoToMyTeam}
      />
    </ChakraProvider>,
  );

  return { onJoin, onSetUpMyPage, onGoToMyTeam };
};

describe('TeamJoinPanel', () => {
  /**
   * A team page is the address a captain shares to recruit. Somebody who follows that link, fundraises
   * on the campaign and is in no team must be able to join from the page itself; sending them back to
   * the browse screen to find the team already in front of them is the journey breaking.
   */
  it('TeamPage_FundraiserInNoTeam_CanJoinFromTheTeamPageItself', async () => {
    const { onJoin } = renderPanel({ isFundraiser: true, myTeamSlug: null });

    await userEvent.click(screen.getByRole('button', { name: 'Join this team' }));

    expect(onJoin).toHaveBeenCalledTimes(1);
  });

  /**
   * Teams are made of fundraising pages. Somebody without one is told the step that qualifies them
   * rather than shown a control that could only refuse them.
   */
  it('TeamPage_VisitorWithNoFundraisingPage_IsOfferedTheStepThatQualifiesThem', async () => {
    const { onSetUpMyPage, onJoin } = renderPanel({ isFundraiser: false });

    expect(
      screen.getByText(
        'Set up your fundraising page for this campaign and you can join this team in the same step.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Set up my fundraising page' }));

    expect(onSetUpMyPage).toHaveBeenCalledTimes(1);
    expect(onJoin).not.toHaveBeenCalled();
  });

  /**
   * One fundraiser belongs to one team on a campaign. Somebody already in another is told which rule
   * stops them and handed the way to the team they are in, so the refusal is not a dead end.
   */
  it('TeamPage_FundraiserAlreadyInAnotherTeam_IsSentToTheTeamTheyAreIn', async () => {
    const { onGoToMyTeam, onJoin } = renderPanel({
      isFundraiser: true,
      myTeamSlug: 'night-runners',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Go to my team' }));

    expect(onGoToMyTeam).toHaveBeenCalledWith('night-runners');
    expect(onJoin).not.toHaveBeenCalled();
  });

  /**
   * Switching teams off stops new joins and leaves the teams that exist readable. The page says which
   * of those two it is, because a silent page reads as a page that is broken.
   */
  it('TeamPage_TeamsSwitchedOff_SaysNoOneNewCanJoinAndOffersNothing', () => {
    renderPanel({ isFundraiser: true, myTeamSlug: null, areTeamsAllowed: false });

    expect(
      screen.getByText(
        'This campaign is no longer taking new team members, so this team is closed to new joins.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  /**
   * A member is already in the team and a captain runs it. Offering either of them a way in would be a
   * control that contradicts the page around it.
   */
  it.each([['Member'], ['Captain']] as const)(
    'TeamPage_ViewerIsAlready_%s_IsOfferedNoWayIn',
    (viewerRole) => {
      renderPanel({ viewerRole, isFundraiser: true });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
  );

  /**
   * A finished campaign takes no money and gains nothing from a new member. The page is history at that
   * point, so it stops recruiting rather than inviting somebody into something that has ended.
   */
  it('TeamPage_CampaignFinished_StopsRecruiting', () => {
    renderPanel({ isFundraiser: true, myTeamSlug: null, isCampaignOpen: false });

    expect(screen.queryByRole('button', { name: 'Join this team' })).not.toBeInTheDocument();
  });

  it('TeamPage_JoinAction_IsATouchTargetWithAPointerCursor', () => {
    renderPanel({ isFundraiser: true, myTeamSlug: null });

    expect(screen.getByRole('button', { name: 'Join this team' })).toHaveStyle({
      minHeight: '44px',
      cursor: 'pointer',
    });
  });
});
