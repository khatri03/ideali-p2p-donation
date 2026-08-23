import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jwtDecode = vi.fn();

vi.mock('jwt-decode', () => ({ jwtDecode: (...args: unknown[]) => jwtDecode(...args) }));

const { isFundraiser } = await import('./fundraiserClaim');

describe('fundraiserClaim', () => {
  beforeEach(() => {
    jwtDecode.mockReset();
    localStorage.setItem('AuthToken', 'a.token.value');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Claim_TokenCarriesTheFundraiserClaim_ReportsThemAsFundraising', () => {
    jwtDecode.mockReturnValue({ isFundraiser: 'true' });

    expect(isFundraiser()).toBe(true);
  });

  /** The claim is emitted only when true, so an absent claim means "not fundraising", not "unknown". */
  it('Claim_TokenWithoutTheClaim_ReportsThemAsNotFundraising', () => {
    jwtDecode.mockReturnValue({ userAllowedModules: ['Donation'] });

    expect(isFundraiser()).toBe(false);
  });

  it('Claim_ClaimPresentButFalse_ReportsThemAsNotFundraising', () => {
    jwtDecode.mockReturnValue({ isFundraiser: 'false' });

    expect(isFundraiser()).toBe(false);
  });

  it('Claim_NobodySignedIn_ReportsThemAsNotFundraisingWithoutDecodingAnything', () => {
    localStorage.removeItem('AuthToken');

    expect(isFundraiser()).toBe(false);
    expect(jwtDecode).not.toHaveBeenCalled();
  });

  it('Claim_UnreadableToken_ReportsThemAsNotFundraisingRatherThanThrowing', () => {
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(isFundraiser()).toBe(false);
  });
});
