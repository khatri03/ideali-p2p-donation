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

  /** One very large gift must read as money rather than as an unbroken run of digits. */
  it('Format_SingleEnormousDonation_IsGroupedRatherThanRunTogether', () => {
    expect(formatMoney(1250000, 'USD')).toBe('$1,250,000');
  });

  it('Format_NothingRaisedYet_ReadsAsZeroRatherThanAsAnEmptyString', () => {
    expect(formatMoney(0, 'USD')).toBe('$0');
  });

  /** A campaign whose refunds outweigh its gifts must still render, negative and legible. */
  it('Format_AmountBelowZero_StillRendersAsMoney', () => {
    expect(formatMoney(-25, 'USD')).toBe('-$25');
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
