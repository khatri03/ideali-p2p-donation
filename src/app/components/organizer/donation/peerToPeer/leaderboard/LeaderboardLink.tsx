import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { MdEmojiEvents } from 'react-icons/md';
import { LEADERBOARD_HEADING } from './leaderboardCopy';
import { leaderboardPath } from './leaderboardPaths';

interface LeaderboardLinkProps {
  campaignSlug: string;
  /**
   * Whether this particular reader can actually open the board. Rendered as nothing at all when they
   * cannot, so nobody is offered a link that lands them on "not found": for a public surface that
   * means the charity publishes the standings to everyone, and for the charity's own screens it means
   * the board is not switched off.
   */
  isReachable: boolean;
}

/** The one way into the standings from a public page, so the wording and the address cannot drift. */
export const LeaderboardLink = ({ campaignSlug, isReachable }: LeaderboardLinkProps) =>
  isReachable ? (
    <Button
      as={RouterLink}
      to={leaderboardPath(campaignSlug)}
      leftIcon={<MdEmojiEvents aria-hidden="true" />}
      variant="outline"
      colorScheme="brand"
      minH="44px"
      borderRadius="12px"
      w={{ base: 'full', md: 'auto' }}
      sx={{ cursor: 'pointer' }}
    >
      {LEADERBOARD_HEADING}
    </Button>
  ) : null;

export default LeaderboardLink;
