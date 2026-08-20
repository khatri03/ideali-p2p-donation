import { MenuItem } from '@chakra-ui/react';

export const PEER_TO_PEER_MENU_LABEL = 'Peer-to-peer Fundraising';
export const PEER_TO_PEER_DRAFT_HINT =
  'Publish this campaign before setting up peer-to-peer fundraising.';

/**
 * A draft campaign has no public page, so a supporter page raised against it would point at nothing.
 * The check is case-insensitive because it may only ever refuse more, never let a draft through.
 */
export const isPeerToPeerBlockedByDraft = (status?: string): boolean =>
  (status ?? '').trim().toLowerCase() === 'draft';

interface PeerToPeerMenuItemProps {
  status?: string;
  onOpen: () => void;
}

/**
 * The single entry point into peer-to-peer settings. Every campaign menu renders this rather than
 * repeating the draft rule, so the rule can only ever be changed in one place.
 */
export const PeerToPeerMenuItem = ({ status, onOpen }: PeerToPeerMenuItemProps) => {
  const isBlocked = isPeerToPeerBlockedByDraft(status);

  return (
    <MenuItem
      onClick={onOpen}
      isDisabled={isBlocked}
      cursor={isBlocked ? 'not-allowed' : 'pointer'}
      title={isBlocked ? PEER_TO_PEER_DRAFT_HINT : undefined}
      _disabled={{ color: 'gray.500', opacity: 1, cursor: 'not-allowed' }}
    >
      {PEER_TO_PEER_MENU_LABEL}
    </MenuItem>
  );
};
