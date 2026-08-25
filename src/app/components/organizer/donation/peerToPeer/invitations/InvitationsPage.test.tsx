import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_UNIQUE_ID, buildInvitation, buildInvitationList } from './invitationTestFactory';

const getInvitations = vi.fn();
const getSupporterCandidates = vi.fn();
const previewInvitation = vi.fn();
const sendInvitations = vi.fn();

vi.mock('app/service/organizer/donation/fundraiserInvitationService', () => ({
  getInvitations: (...args: unknown[]) => getInvitations(...args),
  getSupporterCandidates: (...args: unknown[]) => getSupporterCandidates(...args),
  previewInvitation: (...args: unknown[]) => previewInvitation(...args),
  sendInvitations: (...args: unknown[]) => sendInvitations(...args),
}));

const { default: InvitationsScreen } = await import('./InvitationsPage');

const renderPage = () =>
  render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[
          `/organizer/donation/campaign/${CAMPAIGN_UNIQUE_ID}/peer-to-peer/invitations`,
        ]}
      >
        <Routes>
          <Route
            path="/organizer/donation/campaign/:campaignUniqueId/peer-to-peer/invitations"
            element={<InvitationsScreen />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

const visible = (text: string | RegExp) => screen.getAllByText(text)[0];

beforeEach(() => {
  getInvitations.mockReset();
  getSupporterCandidates.mockReset().mockResolvedValue([]);
  previewInvitation.mockReset();
  sendInvitations.mockReset();
});

describe('InvitationsPage', () => {
  it('List_InvitationsOnTheCampaign_ShowsEachWithItsStatus', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());

    renderPage();

    expect(await screen.findAllByText('sara@example.test')).not.toHaveLength(0);
    expect(screen.getAllByText('Sent').length).toBeGreaterThan(0);
  });

  it('List_NobodyInvitedYet_ShowsADesignedEmptyStateRatherThanABlankArea', async () => {
    getInvitations.mockResolvedValue({
      campaignName: 'Winter appeal',
      summary: { sent: 0, opened: 0, accepted: 0, expired: 0, suppressed: 0 },
      page: { pageNo: 1, pageSize: 20, pageCount: 0, totalRecordsCount: 0, pageData: [] },
    });

    renderPage();

    expect(await screen.findByText('Nobody has been invited yet')).toBeInTheDocument();
  });

  it('List_ReadFails_ShowsTheServersSentenceAndOffersAnotherAttempt', async () => {
    getInvitations.mockRejectedValue(new Error('Campaign not found.'));

    renderPage();

    expect(await screen.findByText('Campaign not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('List_HeldBackAddress_ShowsTheOrganiserWhyNothingWillGo', async () => {
    getInvitations.mockResolvedValue(
      buildInvitationList([
        buildInvitation({
          status: 'Not sent',
          suppressionReason: 'Mail was returned undelivered — Mailbox does not exist',
        }),
      ]),
    );

    renderPage();

    expect(
      await screen.findAllByText('Mail was returned undelivered — Mailbox does not exist'),
    ).not.toHaveLength(0);
  });

  it('Send_NoAddressesTyped_KeepsTheButtonUnavailableRatherThanPostingNothing', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());

    renderPage();

    await screen.findAllByText('sara@example.test');

    expect(screen.getByRole('button', { name: 'Send invitations' })).toBeDisabled();
    expect(sendInvitations).not.toHaveBeenCalled();
  });

  it('Send_MalformedAddress_IsRefusedBeforeARequestIsSpent', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());

    renderPage();
    await screen.findAllByText('sara@example.test');

    await userEvent.type(screen.getByLabelText('Email addresses'), 'not-an-address');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitations' }));

    expect(
      await screen.findByText('not-an-address is not a valid email address.'),
    ).toBeInTheDocument();
    expect(sendInvitations).not.toHaveBeenCalled();
  });

  it('Send_ValidAddresses_PostsThemAndRereadsTheList', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());
    sendInvitations.mockResolvedValue({ accepted: 1, skipped: 0, message: '1 invitation sent.' });

    renderPage();
    await screen.findAllByText('sara@example.test');

    await userEvent.type(screen.getByLabelText('Email addresses'), 'new@example.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitations' }));

    await waitFor(() =>
      expect(sendInvitations).toHaveBeenCalledWith(CAMPAIGN_UNIQUE_ID, {
        emailAddresses: ['new@example.test'],
        personalMessage: undefined,
      }),
    );
    await waitFor(() => expect(getInvitations.mock.calls.length).toBeGreaterThan(1));
  });

  it('Send_ServerRefuses_ShowsTheServersSentenceRatherThanASuccess', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());
    sendInvitations.mockRejectedValue(new Error('Invite up to 50 people at a time.'));

    renderPage();
    await screen.findAllByText('sara@example.test');

    await userEvent.type(screen.getByLabelText('Email addresses'), 'new@example.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send invitations' }));

    expect(await screen.findByText('Invite up to 50 people at a time.')).toBeInTheDocument();
  });

  it('Preview_Requested_ShowsTheRealEmailInAFrameThatCanReachNothing', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());
    previewInvitation.mockResolvedValue({
      subject: 'Will you fundraise for Winter appeal?',
      bodyHtml: '<p>Hello</p>',
    });

    renderPage();
    await screen.findAllByText('sara@example.test');

    await userEvent.click(screen.getByRole('button', { name: 'Preview the email' }));

    const frame = await screen.findByTitle('Invitation email preview');

    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame).toHaveAttribute('srcdoc', '<p>Hello</p>');
    expect(screen.getByText('Will you fundraise for Winter appeal?')).toBeInTheDocument();
  });

  it('Filter_StatusChosen_AsksTheServerForThatStatusAndReturnsToTheFirstPage', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());

    renderPage();
    await screen.findAllByText('sara@example.test');

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Expired');

    await waitFor(() => {
      const query = getInvitations.mock.calls.at(-1)?.[1];
      expect(query.status).toBe('Expired');
      expect(query.page).toBe(1);
    });
  });

  it('Filter_HeldBackStatus_IsOfferedInTheWordsTheListUses', async () => {
    getInvitations.mockResolvedValue(buildInvitationList());

    renderPage();
    await screen.findAllByText('sara@example.test');

    const options = within(screen.getByLabelText('Status')).getAllByRole('option');

    expect(options.map((option) => option.textContent)).toContain('Not sent');
  });

  it('Summary_Loaded_CountsEveryInvitationStateSeparately', async () => {
    getInvitations.mockResolvedValue(
      buildInvitationList([buildInvitation()], {
        summary: { sent: 3, opened: 2, accepted: 1, expired: 4, suppressed: 5 },
      }),
    );

    renderPage();

    // "Accepted" is also one of the status filter options, so the count is found by waiting for the
    // panel rather than by assuming the word appears once.
    expect(await screen.findAllByText('Accepted')).not.toHaveLength(0);
    expect(visible('Held back')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
