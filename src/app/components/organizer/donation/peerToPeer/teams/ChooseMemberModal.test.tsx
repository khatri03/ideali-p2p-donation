import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildTeamMember } from '../peerToPeerTestFactory';
import ChooseMemberModal from './ChooseMemberModal';
import { MEMBERS_VISIBLE_LIMIT } from './teamCopy';

vi.mock('app/service/organizer/donation/fundraiserConsoleService', () => ({
  fundraiserPhotoUrl: (id: string) => `/api/images/${id}.png`,
}));

const membersNumbering = (count: number) =>
  Array.from({ length: count }, (unused, index) =>
    buildTeamMember({
      uniqueId: `member-${index}`,
      fundraiserSlug: `member-${index}`,
      displayName: `Fundraiser ${index}`,
      isCaptain: index === 0,
    }),
  );

const renderModal = (count: number, isOpen = true) => {
  const onChoose = vi.fn();

  const view = render(
    <ChakraProvider>
      <ChooseMemberModal
        isOpen={isOpen}
        members={membersNumbering(count)}
        currencySymbol="USD"
        onChoose={onChoose}
        onClose={vi.fn()}
      />
    </ChakraProvider>,
  );

  return { onChoose, view };
};

describe('ChooseMemberModal', () => {
  /**
   * A donor arrives meaning to support one person. Scrolling a large team to find them is how a donor
   * gives up between deciding to give and giving.
   */
  it('ChooseMember_LargeTeam_CanBeFoundByName', async () => {
    renderModal(MEMBERS_VISIBLE_LIMIT + 12);

    await userEvent.type(screen.getByLabelText('Search this team'), 'Fundraiser 11');

    expect(screen.getByRole('button', { name: 'Donate to Fundraiser 11' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Donate to Fundraiser 2' })).not.toBeInTheDocument();
  });

  /** A control that filters a list already visible in full is one more thing to read and nothing more. */
  it('ChooseMember_TeamThatFitsOnScreen_IsNotGivenASearchItDoesNotNeed', () => {
    renderModal(MEMBERS_VISIBLE_LIMIT);

    expect(screen.queryByLabelText('Search this team')).not.toBeInTheDocument();
  });

  /**
   * A search that matches nobody leaves an empty panel that reads as a page which failed. It says what
   * happened and what clears it instead.
   */
  it('ChooseMember_SearchMatchesNobody_SaysSoRatherThanShowingAnEmptyList', async () => {
    renderModal(MEMBERS_VISIBLE_LIMIT + 12);

    await userEvent.type(screen.getByLabelText('Search this team'), 'nobody here');

    expect(screen.getByText(/Nobody in this team matches that search/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Donate to Fundraiser/ })).not.toBeInTheDocument();
  });

  /**
   * A search left behind from a previous visit would hide most of the team the next time the donor
   * opens it, and they would have no idea why.
   */
  it('ChooseMember_Reopened_ForgetsThePreviousSearch', async () => {
    const total = MEMBERS_VISIBLE_LIMIT + 12;
    const { view } = renderModal(total);

    await userEvent.type(screen.getByLabelText('Search this team'), 'Fundraiser 11');

    view.rerender(
      <ChakraProvider>
        <ChooseMemberModal
          isOpen={false}
          members={membersNumbering(total)}
          currencySymbol="USD"
          onChoose={vi.fn()}
          onClose={vi.fn()}
        />
      </ChakraProvider>,
    );

    view.rerender(
      <ChakraProvider>
        <ChooseMemberModal
          isOpen
          members={membersNumbering(total)}
          currencySymbol="USD"
          onChoose={vi.fn()}
          onClose={vi.fn()}
        />
      </ChakraProvider>,
    );

    expect(screen.getByLabelText('Search this team')).toHaveValue('');
    expect(screen.getAllByRole('button', { name: /^Donate to Fundraiser/ })).toHaveLength(total);
  });
});
