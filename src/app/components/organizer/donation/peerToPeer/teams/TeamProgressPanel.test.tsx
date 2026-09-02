import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TeamProgressPanel from './TeamProgressPanel';

interface PanelOverrides {
  raisedAmount?: number;
  donorCount?: number;
  memberCount?: number;
}

const renderPanel = (teamGoal: number | null, overrides: PanelOverrides = {}) =>
  render(
    <ChakraProvider>
      <TeamProgressPanel
        organizerName="Hope Foundation"
        raisedAmount={overrides.raisedAmount ?? 400}
        teamGoal={teamGoal}
        donorCount={overrides.donorCount ?? 31}
        memberCount={overrides.memberCount ?? 2}
        currencySymbol="USD"
        isCampaignOpen
        onDonate={vi.fn()}
      />
    </ChakraProvider>,
  );

describe('TeamProgressPanel', () => {
  /**
   * With a goal beside it the figure explains itself. Without one it is a bare number at the top of a
   * card, so the panel says what the number is before it says it.
   */
  it('TeamProgress_NoTeamGoal_NamesTheFigureItIsShowing', () => {
    renderPanel(null);

    expect(screen.getByText('Raised so far')).toBeInTheDocument();
    expect(screen.getByText('$400')).toBeInTheDocument();
  });

  /** A goal already says what the figure is measured against, so the label would only repeat it. */
  it('TeamProgress_TeamGoalSet_LetsTheGoalExplainTheFigure', () => {
    renderPanel(1000);

    expect(screen.queryByText('Raised so far')).not.toBeInTheDocument();
    expect(screen.getByText('$400 of $1,000')).toBeInTheDocument();
  });

  /**
   * A donor count is on the page to tell a reader other people are giving. One or two says the
   * opposite, and says it to somebody who has not decided yet, so the team is described by the people
   * fundraising in it until the count can do the job it is there for.
   */
  it('TeamProgress_AlmostNobodyHasGivenYet_DescribesTheTeamWithoutTheDonorCount', () => {
    renderPanel(1000, { donorCount: 1, memberCount: 2 });

    expect(screen.queryByText(/donor/)).not.toBeInTheDocument();
    expect(screen.getByText('2 fundraisers')).toBeInTheDocument();
  });

  /** Once the count reads as a crowd it is the strongest thing on the panel, so it is shown. */
  it('TeamProgress_EnoughDonorsToEncourage_ShowsTheCountBesideTheTeamSize', () => {
    renderPanel(1000, { donorCount: 31, memberCount: 2 });

    expect(screen.getByText('31 donors across the team · 2 fundraisers')).toBeInTheDocument();
  });

  /**
   * The bar already shows how far along the team is. Spelling a single-digit percentage out underneath
   * adds nothing and reads as a verdict on the team to the one person still deciding whether to give.
   */
  it('TeamProgress_BarelyStarted_LeavesThePercentageToTheBarAlone', () => {
    renderPanel(99999, { raisedAmount: 1003 });

    expect(screen.queryByText(/% there/)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  /** The total raised is never hidden, however small it is; only the wording around it changes. */
  it('TeamProgress_BarelyStarted_StillShowsEveryPennyRaised', () => {
    renderPanel(99999, { raisedAmount: 1003 });

    expect(screen.getByText('$1,003 of $99,999')).toBeInTheDocument();
  });

  /** Past the point where it encourages rather than discourages, the figure is written out. */
  it('TeamProgress_WellUnderway_WritesThePercentageOutInWords', () => {
    renderPanel(1000, { raisedAmount: 400 });

    expect(screen.getByText('40% there')).toBeInTheDocument();
  });
});
