import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitationLanding } from 'app/interface/donationInter/fundraiserInvitationDto';

const openInvitation = vi.fn();
const acceptInvitation = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserInvitationService', () => ({
  openInvitation: (...args: unknown[]) => openInvitation(...args),
  acceptInvitation: (...args: unknown[]) => acceptInvitation(...args),
}));

const { default: InvitationLandingScreen } = await import('./InvitationLandingPage');

const CAMPAIGN_UNIQUE_ID = '11111111-2222-3333-4444-555555555555';
const TOKEN = 'live-token';

const landing: InvitationLanding = {
  campaignUniqueId: CAMPAIGN_UNIQUE_ID,
  campaignName: 'Winter appeal',
  organizerName: 'Hope Foundation',
  invitedByName: 'Hope Foundation',
  personalMessage: null,
  emailAddress: 'sara@example.test',
};

const renderPage = (token: string | null = TOKEN) =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[
          `/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/invitation${
            token === null ? '' : `?token=${token}`
          }`,
        ]}
      >
        <Routes>
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/invitation"
            element={<InvitationLandingScreen />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => {
  openInvitation.mockReset();
  acceptInvitation.mockReset();
  localStorage.clear();
});

afterEach(() => localStorage.clear());

describe('InvitationLandingPage', () => {
  it('Landing_ValidLink_NamesTheCharityAndTheCampaign', async () => {
    openInvitation.mockResolvedValue(landing);

    renderPage();

    expect(await screen.findByText('Hope Foundation')).toBeInTheDocument();
    expect(screen.getByText('Winter appeal')).toBeInTheDocument();
  });

  it('Landing_PersonalMessage_IsShownAsTheWordsThatWereTypedAndNotAsMarkup', async () => {
    openInvitation.mockResolvedValue({
      ...landing,
      personalMessage: '<script>alert(1)</script>',
    });

    renderPage();

    expect(await screen.findByText('<script>alert(1)</script>')).toBeInTheDocument();
  });

  it('Landing_LinkWithNoToken_SaysSoRatherThanCallingTheServer', async () => {
    renderPage(null);

    expect(
      await screen.findByText(
        'This link is incomplete. Open the invitation from the email you were sent.',
      ),
    ).toBeInTheDocument();
    expect(openInvitation).not.toHaveBeenCalled();
  });

  it('Landing_RefusedLink_ShowsTheServersSentenceAndOffersNoForm', async () => {
    openInvitation.mockImplementation(() =>
      Promise.reject(new Error('This invitation is no longer valid.')),
    );

    renderPage();

    expect(await screen.findByText('This invitation is no longer valid.')).toBeInTheDocument();
    expect(screen.queryByLabelText('The name on your page')).not.toBeInTheDocument();
  });

  it('Landing_NotSignedIn_OffersSignInRatherThanAFormThatWouldBeRefused', async () => {
    openInvitation.mockResolvedValue(landing);

    renderPage();

    expect(await screen.findByRole('link', { name: 'Sign in to accept' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set up my page' })).not.toBeInTheDocument();
  });

  it('Landing_SignInLink_ComesBackToThisInvitationRatherThanADashboard', async () => {
    openInvitation.mockResolvedValue(landing);

    renderPage();

    const link = await screen.findByRole('link', { name: 'Sign in to accept' });

    expect(link.getAttribute('href')).toContain('returnPath=');
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain(
      `/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/invitation?token=${TOKEN}`,
    );
  });

  it('Accept_NoDisplayName_IsRefusedBeforeARequestIsSpent', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Set up my page' }));

    expect(
      await screen.findByText('Enter the name that should appear on your page.'),
    ).toBeInTheDocument();
    expect(acceptInvitation).not.toHaveBeenCalled();
  });

  it('Accept_FilledIn_SendsTheTokenWithTheChosenDetails', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockResolvedValue({
      fundraiserUniqueId: 'f1',
      slug: 'sara-malik',
      campaignSlug: 'winter-appeal',
      isAwaitingApproval: false,
    });

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    await waitFor(() =>
      expect(acceptInvitation).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, {
        token: TOKEN,
        displayName: 'Sara Malik',
        story: undefined,
        personalGoal: undefined,
      }),
    );
  });

  it('Accept_Succeeded_OffersTheNewPageRatherThanLeavingThePersonOnTheForm', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockResolvedValue({
      fundraiserUniqueId: 'f1',
      slug: 'sara-malik',
      campaignSlug: 'winter-appeal',
      isAwaitingApproval: false,
    });

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    const link = await screen.findByRole('link', { name: 'Open my page' });

    expect(link).toHaveAttribute('href', '/campaigns/winter-appeal/sara-malik');
  });

  it('Accept_CampaignReviewsPagesFirst_SaysSoRatherThanClaimingItIsLive', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockResolvedValue({
      fundraiserUniqueId: 'f1',
      slug: 'sara-malik',
      campaignSlug: 'winter-appeal',
      isAwaitingApproval: true,
    });

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    expect(
      await screen.findByText('Your page has gone to the charity'),
    ).toBeInTheDocument();
  });

  it('Accept_RefusedBecauseTheAccountIsWrong_ShowsTheServersSentence', async () => {
    localStorage.setItem('AuthToken', 'signed-in');
    openInvitation.mockResolvedValue(landing);
    acceptInvitation.mockImplementation(() =>
      Promise.reject(new Error('This invitation was sent to a different email address.')),
    );

    renderPage();

    await userEvent.type(await screen.findByLabelText(/The name on your page/), 'Sara Malik');
    await userEvent.click(screen.getByRole('button', { name: 'Set up my page' }));

    expect(
      await screen.findByText('This invitation was sent to a different email address.'),
    ).toBeInTheDocument();
  });
});
