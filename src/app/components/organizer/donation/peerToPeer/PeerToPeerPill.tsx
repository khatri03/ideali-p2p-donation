import { Badge, Box, Text, Tooltip } from '@chakra-ui/react';
import { MdVolunteerActivism } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { peerToPeerSettingsPath } from './moderation/moderationPaths';
import { PEER_TO_PEER_PILL_HINT, PEER_TO_PEER_PILL_LABEL } from './peerToPeerCopy';

interface PeerToPeerPillProps {
  campaignUniqueId: string;
  /** Whether this campaign lets supporters raise money on its behalf. */
  isPeerToPeerEnabled: boolean;
}

/**
 * Marks a campaign card as one that supporters may fundraise for. Without it the campaign list is the
 * one screen a charity opens daily that cannot say which of its campaigns run supporter fundraising,
 * so the answer costs an open of every campaign in turn.
 *
 * It stays one short word so a card's badge row keeps its single line at 375px, and carries the
 * sentence in its spoken name and tooltip rather than in the pill, because the card has no room for
 * it and a phone cannot hover. The whole pill opens that campaign's settings, which is the screen
 * somebody checking the marking wants next.
 */
export const PeerToPeerPill = ({ campaignUniqueId, isPeerToPeerEnabled }: PeerToPeerPillProps) => {
  if (!campaignUniqueId || !isPeerToPeerEnabled) {
    return null;
  }

  return (
    <Tooltip label={PEER_TO_PEER_PILL_HINT} hasArrow openDelay={300}>
      <Box
        as={RouterLink}
        to={peerToPeerSettingsPath(campaignUniqueId)}
        aria-label={`${PEER_TO_PEER_PILL_LABEL}. ${PEER_TO_PEER_PILL_HINT}`}
        display="inline-flex"
        alignItems="center"
        minH="44px"
        flexShrink={0}
        sx={{ cursor: 'pointer' }}
      >
        <Badge
          display="inline-flex"
          alignItems="center"
          gap={1}
          colorScheme="purple"
          variant="subtle"
          borderRadius="full"
          px={2}
          py={0.5}
          fontSize="11px"
          fontWeight="medium"
          textTransform="none"
          whiteSpace="nowrap"
        >
          <Box as={MdVolunteerActivism} aria-hidden flexShrink={0} />
          <Text as="span">{PEER_TO_PEER_PILL_LABEL}</Text>
        </Badge>
      </Box>
    </Tooltip>
  );
};

export default PeerToPeerPill;
