import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildTeamMember } from '../peerToPeerTestFactory';
import TeamMembersPanel from './TeamMembersPanel';
import { MEMBERS_VISIBLE_LIMIT } from './teamCopy';

const membersNumbering = (count: number) =>
  Array.from({ length: count }, (unused, index) =>
    buildTeamMember({
      uniqueId: `member-${index}`,
      fundraiserSlug: `member-${index}`,
      displayName: `Fundraiser ${index}`,
      isCaptain: index === 0,
    }),
  );

const renderPanel = (count: number) => {
  render(
    <ChakraProvider>
      <TeamMembersPanel
        members={membersNumbering(count)}
        currencySymbol="USD"
        onViewPage={vi.fn()}
      />
    </ChakraProvider>,
  );
};

describe('TeamMembersPanel', () => {
  /**
   * The donate action sits under this panel. A team large enough to fill a phone screen with rows
   * pushed that action out of reach entirely, so the list is cut to a length the page survives.
   */
  it('TeamMembers_MoreThanTheListHolds_ShowsOnlyTheFirstFew', () => {
    renderPanel(MEMBERS_VISIBLE_LIMIT + 12);

    expect(screen.getAllByRole('button', { name: /^View page for/ })).toHaveLength(
      MEMBERS_VISIBLE_LIMIT,
    );
  });

  /**
   * Cutting the list must never make a member unreachable: everybody in the team is one press away,
   * and the count in the offer is the real total rather than what is on screen.
   */
  it('TeamMembers_ListCut_StillReachesEveryMemberInOnePress', async () => {
    const total = MEMBERS_VISIBLE_LIMIT + 12;

    renderPanel(total);

    await userEvent.click(screen.getByRole('button', { name: `Show all ${total} fundraisers` }));

    expect(screen.getAllByRole('button', { name: /^View page for/ })).toHaveLength(total);
    expect(screen.getByRole('button', { name: 'Show fewer' })).toBeInTheDocument();
  });

  /**
   * A team that fits is shown whole. Offering to expand a list that is already complete is a control
   * that does nothing.
   */
  it('TeamMembers_TeamFitsInTheList_OffersNothingToExpand', () => {
    renderPanel(MEMBERS_VISIBLE_LIMIT);

    expect(screen.getAllByRole('button', { name: /^View page for/ })).toHaveLength(
      MEMBERS_VISIBLE_LIMIT,
    );
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
  });

  /**
   * An empty list is a state, not a gap. Saying what is missing and what changes it stops the panel
   * reading as a page that failed to load.
   */
  it('TeamMembers_NobodyInTheTeamYet_SaysSoRatherThanRenderingAnEmptyPanel', () => {
    renderPanel(0);

    expect(
      screen.getByText(
        'Nobody is fundraising in this team yet. The team total starts as soon as somebody joins.',
      ),
    ).toBeInTheDocument();
  });
});
