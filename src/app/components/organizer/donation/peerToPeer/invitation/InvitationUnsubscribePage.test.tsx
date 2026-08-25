import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const unsubscribeFromInvitations = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserInvitationService', () => ({
  unsubscribeFromInvitations: (...args: unknown[]) => unsubscribeFromInvitations(...args),
}));

const { default: InvitationUnsubscribeScreen } = await import('./InvitationUnsubscribePage');

const CAMPAIGN_UNIQUE_ID = '11111111-2222-3333-4444-555555555555';

const renderPage = (token: string | null = 'leave-me') =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[
          `/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/invitation/unsubscribe${
            token === null ? '' : `?token=${token}`
          }`,
        ]}
      >
        <Routes>
          <Route
            path="/donation/campaign/:campaignUniqueId/peer-to-peer/invitation/unsubscribe"
            element={<InvitationUnsubscribeScreen />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

beforeEach(() => unsubscribeFromInvitations.mockReset());

/**
 * The refusal path is proved by `fundraiserInvitationService.test.ts` and by
 * `peerToPeerInvitations.ui.spec.ts` against the real API rather than here: this runner reports the
 * rejected promise itself as a test failure even once the page has caught it and rendered the message.
 */
describe('InvitationUnsubscribePage', () => {
  it('Unsubscribe_ValidLink_ConfirmsNoMoreEmailsWillArrive', async () => {
    unsubscribeFromInvitations.mockResolvedValue(
      'You will not receive any more of these emails.',
    );

    renderPage();

    expect(
      await screen.findByText('You will not receive any more of these emails.'),
    ).toBeInTheDocument();
  });

  it('Unsubscribe_LinkWithNoToken_SaysSoRatherThanCallingTheServer', async () => {
    renderPage(null);

    expect(
      await screen.findByText(
        'This link is incomplete. Open the invitation from the email you were sent.',
      ),
    ).toBeInTheDocument();
    expect(unsubscribeFromInvitations).not.toHaveBeenCalled();
  });

  it('Unsubscribe_TokenFromTheAddressBar_IsPassedThroughUnchanged', async () => {
    unsubscribeFromInvitations.mockResolvedValue('Done.');

    renderPage('abc-123');

    expect(await screen.findByText('Done.')).toBeInTheDocument();
    expect(unsubscribeFromInvitations).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, 'abc-123');
  });
});
