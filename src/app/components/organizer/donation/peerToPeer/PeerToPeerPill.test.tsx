import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PEER_TO_PEER_PILL_HINT } from './peerToPeerCopy';
import { PeerToPeerPill } from './PeerToPeerPill';

const CAMPAIGN = '9176ec7b-661b-4da6-b970-90076f3e60ca';

const renderPill = (isPeerToPeerEnabled: boolean, campaignUniqueId: string = CAMPAIGN) =>
  render(
    <MemoryRouter>
      <PeerToPeerPill
        campaignUniqueId={campaignUniqueId}
        isPeerToPeerEnabled={isPeerToPeerEnabled}
      />
    </MemoryRouter>,
  );

describe('PeerToPeerPill', () => {
  /**
   * A campaign that runs supporter fundraising is marked as one, because the campaign list is the only
   * screen that shows every campaign at once and it is where the question is asked.
   */
  it('Pill_CampaignRunsSupporterFundraising_MarksTheCard', () => {
    renderPill(true);

    expect(screen.getByText('P2P')).toBeInTheDocument();
  });

  /**
   * A campaign that runs no supporter fundraising must look exactly as it did before the pill existed.
   * A pill on every card marks nothing at all.
   */
  it('Pill_CampaignRunsNoSupporterFundraising_ShowsNothingAtAll', () => {
    const { container } = renderPill(false);

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * Following the pill lands on that campaign's own settings, the screen that says what supporter
   * fundraising is doing and the one place it can be turned off.
   */
  it('Pill_Followed_LeadsToThatCampaignsFundraisingSettings', () => {
    renderPill(true);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/organizer/donation/campaign/${CAMPAIGN}/peer-to-peer`,
    );
  });

  /**
   * A short pill explains itself to somebody who cannot see it: the spoken name opens with the pill's
   * own word, so a voice control names the control on screen, then says what the marking means.
   */
  it('Pill_ReadAloud_OpensWithThePillsWordThenExplainsTheAbbreviation', () => {
    renderPill(true);

    expect(screen.getByRole('link', { name: `P2P. ${PEER_TO_PEER_PILL_HINT}` })).toBeInTheDocument();
  });

  /**
   * Without a campaign to open there is nowhere for the pill to lead, so it renders nothing rather
   * than a link landing on a broken address.
   */
  it('Pill_NoCampaignIdentifier_ShowsNothingRatherThanADeadLink', () => {
    const { container } = renderPill(true, '');

    expect(container).toBeEmptyDOMElement();
  });
});
