import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { MdEmojiEvents } from 'react-icons/md';
import { LEADERBOARD_HEADING } from './leaderboardCopy';

interface LeaderboardLinkProps {
  /**
   * Where this particular reader's standings live: the public address on a shared page, the charity's
   * own oversight address on its own screens, so nobody is moved out of the frame they started in.
   */
  to: string;
  /**
   * Whether this particular reader can actually open the board. Rendered as nothing at all when they
   * cannot, so nobody is offered a link that lands them on "not found": for a public surface that
   * means the charity publishes the standings to everyone, and for the charity's own screens it means
   * the board is not switched off.
   */
  isReachable: boolean;
  label?: string;
}

/** The one way into the standings from another screen, so the wording cannot drift. */
export const LeaderboardLink = ({
  to,
  isReachable,
  label = LEADERBOARD_HEADING,
}: LeaderboardLinkProps) =>
  isReachable ? (
    <Button
      as={RouterLink}
      to={to}
      leftIcon={<MdEmojiEvents aria-hidden="true" />}
      variant="outline"
      colorScheme="brand"
      minH="44px"
      borderRadius="12px"
      w={{ base: 'full', md: 'auto' }}
      alignSelf={{ base: 'stretch', md: 'flex-start' }}
      sx={{ cursor: 'pointer' }}
    >
      {label}
    </Button>
  ) : null;

export default LeaderboardLink;
