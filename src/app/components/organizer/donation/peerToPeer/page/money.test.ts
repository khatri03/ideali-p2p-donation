import { describe, expect, it } from 'vitest';
import { formatMoney, goalPercentage } from './money';

describe('formatMoney', () => {
  it('Format_WholeAmount_DropsTheCentsSoAProgressFigureReadsCleanly', () => {
    expect(formatMoney(310, 'USD')).toBe('$310');
  });

  it('Format_AmountWithCents_KeepsThemRatherThanRoundingMoney', () => {
    expect(formatMoney(310.25, 'USD')).toBe('$310.25');
  });

  it('Format_UnknownCurrencyCode_FallsBackRatherThanThrowingAndBlankingThePage', () => {
    expect(formatMoney(50, 'NOT-A-CODE')).toBe('$50');
  });

  it('Format_MissingCurrencyCode_StillProducesAnAmount', () => {
    expect(formatMoney(50, '')).toBe('$50');
  });
});

describe('goalPercentage', () => {
  it('Progress_PartWayToTheGoal_IsRoundedToAWholePercent', () => {
    expect(goalPercentage(310, 500)).toBe(62);
  });

  it('Progress_GoalBeaten_IsCappedAtOneHundredSoTheBarStaysIntact', () => {
    expect(goalPercentage(900, 500)).toBe(100);
  });

  it('Progress_NoGoalSet_HasNoPercentageToShow', () => {
    expect(goalPercentage(310, null)).toBeNull();
    expect(goalPercentage(310, 0)).toBeNull();
  });

  it('Progress_NothingRaisedYet_IsZeroRatherThanNothing', () => {
    expect(goalPercentage(0, 500)).toBe(0);
  });
});
