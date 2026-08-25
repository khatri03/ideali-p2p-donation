import { Flex } from '@chakra-ui/react';
import { RANK_COLUMN } from './leaderboardCopy';

interface RankBadgeProps {
  rank: number;
}

/**
 * The top three are coloured, everything below is neutral. Colour alone never carries the meaning -
 * the place is written inside the badge and read out with it - because a reader who cannot tell gold
 * from bronze still has to know who came first.
 */
const paletteFor = (rank: number) => {
  if (rank === 1) return { bg: 'yellow.400', color: 'navy.800' };
  if (rank === 2) return { bg: 'secondaryGray.400', color: 'navy.800' };
  if (rank === 3) return { bg: 'orange.300', color: 'navy.800' };

  return { bg: 'secondaryGray.200', color: 'navy.700' };
};

export const RankBadge = ({ rank }: RankBadgeProps) => {
  const palette = paletteFor(rank);

  return (
    <Flex
      align="center"
      justify="center"
      minW="36px"
      h="36px"
      px={2}
      borderRadius="12px"
      fontWeight="700"
      fontSize="sm"
      bg={palette.bg}
      color={palette.color}
      _dark={{ bg: rank <= 3 ? palette.bg : 'whiteAlpha.300', color: rank <= 3 ? palette.color : 'white' }}
      aria-label={`${RANK_COLUMN} ${rank}`}
    >
      {rank}
    </Flex>
  );
};

export default RankBadge;
