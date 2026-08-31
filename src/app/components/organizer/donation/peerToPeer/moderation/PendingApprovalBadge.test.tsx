import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PendingApprovalBadge } from './PendingApprovalBadge';

const CAMPAIGN = '9176ec7b-661b-4da6-b970-90076f3e60ca';

const renderBadge = (pendingCount: number, campaignUniqueId: string = CAMPAIGN) =>
  render(
    <MemoryRouter>
      <PendingApprovalBadge campaignUniqueId={campaignUniqueId} pendingCount={pendingCount} />
    </MemoryRouter>,
  );

describe('PendingApprovalBadge', () => {
  /**
   * A campaign with nothing waiting must look exactly as it did before this badge existed. A badge
   * reading "0 awaiting approval" would train the charity to ignore the one that matters.
   */
  it('Badge_NothingWaiting_ShowsNothingAtAll', () => {
    const { container } = renderBadge(0);

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * A count that arrives negative is a broken response, not an instruction to render a warning. The
   * screen stays quiet rather than telling the charity something untrue.
   */
  it('Badge_CountBelowZero_ShowsNothingRatherThanAWarning', () => {
    const { container } = renderBadge(-3);

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * The badge says how many pages are waiting in its own visible text. A phone cannot show a tooltip,
   * so a charity looking at a phone must still be able to read what the badge means.
   */
  it('Badge_PagesWaiting_SaysHowManyInItsOwnVisibleText', () => {
    renderBadge(3);

    expect(screen.getByText('3 awaiting approval')).toBeInTheDocument();
  });

  /** One page waiting reads as one page, not as "1 pages", because the count is part of a sentence. */
  it('Badge_OnePageWaiting_ReadsAsOneRatherThanAPlural', () => {
    renderBadge(1);

    expect(screen.getByText('1 awaiting approval')).toBeInTheDocument();
  });

  /**
   * Following the badge must land on the pages already narrowed to the ones waiting, because that is
   * the only screen carrying the approve and turn-down buttons.
   */
  it('Badge_Followed_LeadsToThePagesAlreadyNarrowedToTheWaitingOnes', () => {
    renderBadge(2);

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/organizer/donation/campaign/${CAMPAIGN}/peer-to-peer/fundraisers?status=PendingApproval`,
    );
  });

  /**
   * Somebody using a screen reader hears the whole sentence, not the shortened pill, and hears the
   * pill's own words first so the name they would speak to a voice control is the name on screen.
   */
  it('Badge_ReadAloud_OpensWithThePillsWordsThenNamesWhatIsWaitingAndWhatToDo', () => {
    renderBadge(2);

    expect(
      screen.getByRole('link', {
        name: '2 awaiting approval. 2 supporter fundraising pages are waiting for your approval. Open them to approve or turn them down.',
      }),
    ).toBeInTheDocument();
  });

  /**
   * Without a campaign to open there is nowhere for the badge to lead, so it renders nothing rather
   * than a link that would land on a broken address.
   */
  it('Badge_NoCampaignIdentifier_ShowsNothingRatherThanADeadLink', () => {
    const { container } = renderBadge(4, '');

    expect(container).toBeEmptyDOMElement();
  });
});
