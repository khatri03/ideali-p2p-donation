import { ChakraProvider, Menu, MenuList } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  PEER_TO_PEER_DRAFT_HINT,
  PEER_TO_PEER_MENU_LABEL,
  PeerToPeerMenuItem,
  isPeerToPeerBlockedByDraft,
} from './PeerToPeerMenuItem';

const renderItem = (status?: string) => {
  const onOpen = vi.fn();

  render(
    <ChakraProvider>
      <Menu isOpen>
        <MenuList>
          <PeerToPeerMenuItem status={status} onOpen={onOpen} />
        </MenuList>
      </Menu>
    </ChakraProvider>,
  );

  return { onOpen, item: screen.getByText(PEER_TO_PEER_MENU_LABEL) };
};

describe('isPeerToPeerBlockedByDraft', () => {
  it('DraftGuard_StatusIsDraft_Blocks', () => {
    expect(isPeerToPeerBlockedByDraft('Draft')).toBe(true);
  });

  it('DraftGuard_StatusIsDraftInAnotherCasing_StillBlocks', () => {
    expect(isPeerToPeerBlockedByDraft('draft')).toBe(true);
    expect(isPeerToPeerBlockedByDraft(' DRAFT ')).toBe(true);
  });

  it('DraftGuard_StatusIsPublished_DoesNotBlock', () => {
    expect(isPeerToPeerBlockedByDraft('Published')).toBe(false);
    expect(isPeerToPeerBlockedByDraft('Ended')).toBe(false);
  });

  it('DraftGuard_StatusMissing_DoesNotBlock', () => {
    expect(isPeerToPeerBlockedByDraft(undefined)).toBe(false);
  });
});

describe('PeerToPeerMenuItem', () => {
  it('MenuItem_DraftCampaign_IsDisabledAndExplainsWhy', () => {
    const { item } = renderItem('Draft');

    expect(item).toHaveAttribute('disabled');
    expect(item).toHaveAttribute('title', PEER_TO_PEER_DRAFT_HINT);
  });

  it('MenuItem_DraftCampaign_ClickDoesNotOpenSettings', async () => {
    const { onOpen, item } = renderItem('Draft');

    await userEvent.click(item, { pointerEventsCheck: 0 });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('MenuItem_PublishedCampaign_ClickOpensSettings', async () => {
    const { onOpen, item } = renderItem('Published');

    await userEvent.click(item);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('MenuItem_PublishedCampaign_CarriesNoBlockedHint', () => {
    const { item } = renderItem('Published');

    expect(item).not.toHaveAttribute('disabled');
    expect(item).not.toHaveAttribute('title');
  });
});
