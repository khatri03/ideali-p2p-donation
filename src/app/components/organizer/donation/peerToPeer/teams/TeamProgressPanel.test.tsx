import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TeamProgressPanel from './TeamProgressPanel';

const renderPanel = (teamGoal: number | null) =>
  render(
    <ChakraProvider>
      <TeamProgressPanel
        organizerName="Hope Foundation"
        raisedAmount={400}
        teamGoal={teamGoal}
        donorCount={31}
        memberCount={2}
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
});
