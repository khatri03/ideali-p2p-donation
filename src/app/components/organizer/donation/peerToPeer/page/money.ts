const FALLBACK_CURRENCY = 'USD';

/**
 * Money arrives from the API as a decimal and is shown, never calculated with. Formatting is the only
 * thing this file does: no rounding rules, no arithmetic, and no assumption about the reader's locale
 * beyond the one their browser already reports.
 */
export const formatMoney = (amount: number, currencyCode: string): string => {
  const code = currencyCode?.trim() || FALLBACK_CURRENCY;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    // An unknown code would otherwise throw and take the whole page down over a formatting detail.
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: FALLBACK_CURRENCY,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  }
};

/** How far along a goal is, clamped so a page that beats its goal shows a full bar rather than a broken one. */
export const goalPercentage = (raised: number, goal: number | null): number | null => {
  if (!goal || goal <= 0) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round((raised / goal) * 100)));
};
