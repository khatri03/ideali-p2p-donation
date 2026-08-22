import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensureAuthenticated = vi.fn();

vi.mock('utils/auth', () => ({
  ensureAuthenticated: () => ensureAuthenticated(),
}));

const { default: FundraiseForThisButton } = await import('./FundraiseForThisButton');

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';

const WhereAmI = () => {
  const location = useLocation();

  return <p>{`${location.pathname}${location.search}`}</p>;
};

const renderButton = (isPeerToPeerEnabled: boolean, campaignUniqueId = CAMPAIGN_ID) =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/donate/start']}>
        <Routes>
          <Route
            path="/donate/start"
            element={
              <FundraiseForThisButton
                campaignUniqueId={campaignUniqueId}
                isPeerToPeerEnabled={isPeerToPeerEnabled}
              />
            }
          />
          <Route path="*" element={<WhereAmI />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  ensureAuthenticated.mockReset();
});

describe('FundraiseForThisButton', () => {
  it('EntryPoint_CampaignWithFundraisingOff_RendersNothing', () => {
    ensureAuthenticated.mockReturnValue(true);

    renderButton(false);

    expect(screen.queryByRole('button', { name: /Fundraise for this/i })).not.toBeInTheDocument();
  });

  it('EntryPoint_CampaignWithoutAnIdentifier_RendersNothing', () => {
    ensureAuthenticated.mockReturnValue(true);

    renderButton(true, '');

    expect(screen.queryByRole('button', { name: /Fundraise for this/i })).not.toBeInTheDocument();
  });

  it('EntryPoint_SignedInSupporter_GoesStraightToTheJoinScreen', async () => {
    ensureAuthenticated.mockReturnValue(true);

    renderButton(true);
    await userEvent.click(screen.getByRole('button', { name: /Fundraise for this/i }));

    expect(
      screen.getByText(`/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`),
    ).toBeInTheDocument();
  });

  /**
   * A visitor with no session stays on the campaign. Sending them to another screen was how they
   * used to lose the thread of what they had come to do.
   */
  it('EntryPoint_SignedOutVisitor_OffersBothWaysInWithoutLeavingTheCampaign', async () => {
    ensureAuthenticated.mockReturnValue(false);

    renderButton(true);
    await userEvent.click(screen.getByRole('button', { name: /Fundraise for this/i }));

    expect(await screen.findByRole('tab', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeInTheDocument();
    expect(
      screen.queryByText(`/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/join`),
    ).not.toBeInTheDocument();
  });
});
