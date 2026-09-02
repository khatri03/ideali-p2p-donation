import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import { buildTeamPage } from '../peerToPeerTestFactory';
import TeamIdentityPanel from './TeamIdentityPanel';

const renderPanel = (overrides: Partial<CampaignTeamPage> = {}) =>
  render(
    <ChakraProvider>
      <MemoryRouter>
        <TeamIdentityPanel team={buildTeamPage(overrides)} />
      </MemoryRouter>
    </ChakraProvider>,
  );

describe('TeamIdentityPanel', () => {
  /**
   * A team address is often the only one somebody was sent. Without a way through to the campaign's
   * other teams, the browse screen is a place they would have to be told about separately.
   */
  it('TeamPage_AnyTeam_ReachesEveryOtherTeamOnTheCampaign', () => {
    renderPanel();

    expect(screen.getByRole('link', { name: 'See every team on this campaign' })).toHaveAttribute(
      'href',
      '/campaigns/winter-appeal/teams',
    );
  });

  /**
   * A finished campaign changes what the whole page means, not only whether one button is offered. The
   * team says so about itself, so a reader who never reaches the donate panel still knows.
   */
  it('TeamPage_CampaignFinished_SaysSoOnTheTeamItself', () => {
    renderPanel({ isCampaignOpen: false });

    expect(screen.getByText('Campaign finished')).toBeInTheDocument();
  });

  /** A live campaign must never be labelled as over: that alone would stop people giving. */
  it('TeamPage_CampaignStillRunning_IsNotLabelledFinished', () => {
    renderPanel();

    expect(screen.queryByText('Campaign finished')).not.toBeInTheDocument();
  });

  /**
   * A wall of text with no mark beside it reads as an unfinished page. A team carries no photo of its
   * own, so the mark stands for the group and is named after the team for anyone who cannot see it.
   */
  it('TeamPage_Team_CarriesAMarkNamedAfterTheTeam', () => {
    renderPanel();

    expect(screen.getByRole('img', { name: 'The Early Risers' })).toBeInTheDocument();
  });

  /**
   * A team name may run long enough to overflow the card it sits in. It wraps rather than being cut,
   * because a team's own name is the one thing its page may not truncate.
   */
  it('TeamPage_LongTeamName_WrapsRatherThanOverflowingTheCard', () => {
    const name = 'The Extremely Determined Early Morning Riverside Running And Fundraising Club';

    renderPanel({ name });

    expect(screen.getByRole('heading', { level: 1, name })).toHaveStyle({
      wordBreak: 'break-word',
    });
  });
});
