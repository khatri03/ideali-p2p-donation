import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GoalProgressBar from './GoalProgressBar';

const renderBar = (percentage: number) =>
  render(
    <ChakraProvider>
      <GoalProgressBar percentage={percentage} label={`${percentage}% of goal`} />
    </ChakraProvider>,
  );

describe('GoalProgressBar', () => {
  /**
   * The bar is the only part of a fundraising total a reader takes in at a glance, so it must report
   * the same figure the caption states rather than an unlabelled decoration.
   */
  it('Progress_GoalPartlyMet_ReportsHowFarAlongItIs', () => {
    renderBar(62);

    const bar = screen.getByRole('progressbar', { name: '62% of goal' });

    expect(bar).toHaveAttribute('aria-valuenow', '62');
  });

  /** A page that has raised nothing still draws a bar, so the panel does not change shape on first gift. */
  it('Progress_NothingRaisedYet_StillDrawsTheBarAtZero', () => {
    renderBar(0);

    expect(screen.getByRole('progressbar', { name: '0% of goal' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});
