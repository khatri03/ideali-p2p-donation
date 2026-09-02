import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DonationSuccessModal, { DonationReturnDestination } from './DonationSuccessModal';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const FUNDRAISER_RETURN: DonationReturnDestination = {
  path: '/campaigns/spring-appeal/f/sarah-khan',
  label: 'Back to their page',
  note: "Your donation counts towards Sarah Khan's total.",
};

const renderModal = (returnTo?: DonationReturnDestination) =>
  render(
    <ChakraProvider>
      <MemoryRouter>
        <DonationSuccessModal
          isOpen
          onClose={vi.fn()}
          campaignId="campaign-123"
          returnTo={returnTo}
        />
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  navigate.mockClear();
});

describe('DonationSuccessModal', () => {
  /**
   * A donation given through somebody's fundraising page is only half delivered if the donor is then
   * dropped on the campaign's own screen: the person they chose is gone, the team behind that person is
   * unreachable, and a fresh donation form is put in front of somebody who has just paid.
   */
  it('DonationSuccess_GivenThroughAFundraiser_ReturnsTheDonorToThatFundraisersPage', async () => {
    renderModal(FUNDRAISER_RETURN);

    await userEvent.click(screen.getByRole('button', { name: 'Back to their page' }));

    expect(navigate).toHaveBeenCalledWith(FUNDRAISER_RETURN.path, { replace: true });
  });

  /** The thank-you names who the money was given through, which is why that page was chosen at all. */
  it('DonationSuccess_GivenThroughAFundraiser_SaysWhoTheDonationCountsFor', () => {
    renderModal(FUNDRAISER_RETURN);

    expect(screen.getByText(FUNDRAISER_RETURN.note)).toBeInTheDocument();
  });

  /**
   * The campaign's own donation screen is unchanged by any of this. A donor who never went through a
   * fundraising page must still land back where they started.
   */
  it('DonationSuccess_GivenStraightToTheCampaign_StillReturnsToTheCampaignScreen', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });

    renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(navigate).toHaveBeenCalledWith('/donate/campaign-123', { replace: true });
  });
});
