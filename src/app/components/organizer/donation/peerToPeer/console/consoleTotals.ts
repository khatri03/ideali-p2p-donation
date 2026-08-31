import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';

export interface FundraisingTotals {
  pageCount: number;
  donorCount: number;
  /**
   * Null when the pages raise in more than one currency. Two hundred dollars and two hundred pounds
   * do not make four hundred of anything, and a headline that pretends otherwise is worse than no
   * headline at all.
   */
  raised: { amount: number; currencySymbol: string } | null;
}

/**
 * Adding money in a browser is adding doubles, so a run of pages ending in cents can produce a total
 * carrying a hundredth of a cent of error. Rounding to the minor unit once, at the end, keeps the
 * headline exactly the sum of the figures printed beneath it.
 */
const toMinorUnit = (amount: number) => Math.round(amount * 100) / 100;

/**
 * What the supporter has raised across every page they own, for the one line they look for first.
 */
export const totalsFor = (pages: MyFundraisingPage[]): FundraisingTotals => {
  const currencySymbols = new Set(pages.map((page) => page.currencySymbol));

  return {
    pageCount: pages.length,
    donorCount: pages.reduce((total, page) => total + page.donorCount, 0),
    raised:
      currencySymbols.size === 1
        ? {
            amount: toMinorUnit(pages.reduce((total, page) => total + page.raisedAmount, 0)),
            currencySymbol: pages[0].currencySymbol,
          }
        : null,
  };
};
