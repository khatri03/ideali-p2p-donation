import { describe, expect, it } from 'vitest';
import { buildMyFundraisingPage } from '../peerToPeerTestFactory';
import { totalsFor } from './consoleTotals';

describe('consoleTotals', () => {
  /** A supporter's headline is the sum of their pages, not the largest of them. */
  it('Totals_SeveralPagesInOneCurrency_AddUpWhatEachHasRaised', () => {
    const totals = totalsFor([
      buildMyFundraisingPage({ raisedAmount: 310 }),
      buildMyFundraisingPage({ uniqueId: 'second', raisedAmount: 90 }),
    ]);

    expect(totals.raised).toEqual({ amount: 400, currencySymbol: 'USD' });
  });

  /**
   * Two hundred dollars and two hundred pounds are not four hundred of anything, so a headline that
   * cannot be stated honestly is not stated at all.
   */
  it('Totals_PagesInDifferentCurrencies_RefuseToProduceASingleFigure', () => {
    const totals = totalsFor([
      buildMyFundraisingPage({ raisedAmount: 310, currencySymbol: 'USD' }),
      buildMyFundraisingPage({ uniqueId: 'second', raisedAmount: 90, currencySymbol: 'CAD' }),
    ]);

    expect(totals.raised).toBeNull();
  });

  /**
   * Adding doubles leaves a fraction of a cent behind, and a headline a hundredth off the figures
   * printed under it reads as a bug in the money rather than a bug in the arithmetic.
   */
  it('Totals_AmountsCarryingCents_MatchTheFiguresPrintedBeneathThem', () => {
    const totals = totalsFor([
      buildMyFundraisingPage({ raisedAmount: 0.1 }),
      buildMyFundraisingPage({ uniqueId: 'second', raisedAmount: 0.2 }),
    ]);

    expect(totals.raised?.amount).toBe(0.3);
  });

  /** Donors are people, not money, so they are counted across every page whatever it raises in. */
  it('Totals_PagesInDifferentCurrencies_StillCountTheirDonorsAndPages', () => {
    const totals = totalsFor([
      buildMyFundraisingPage({ donorCount: 22, currencySymbol: 'USD' }),
      buildMyFundraisingPage({ uniqueId: 'second', donorCount: 3, currencySymbol: 'CAD' }),
    ]);

    expect(totals.pageCount).toBe(2);
    expect(totals.donorCount).toBe(25);
  });
});
