import { Box, SimpleGrid, Skeleton, Stack } from '@chakra-ui/react';

/**
 * Mirrors the real board: the same four figures across the top and the same row height beneath, so
 * nothing on the page moves when the standings arrive.
 */
export const LeaderboardSkeleton = () => (
  <Stack gap={{ base: 4, md: 6 }}>
    <Stack gap={2}>
      <Skeleton height={{ base: '28px', md: '36px' }} width="40%" />
      <Skeleton height="18px" width="60%" />
    </Stack>

    <SimpleGrid
      columns={{ base: 2, md: 4 }}
      gap={{ base: 3, md: 5 }}
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
    >
      {[0, 1, 2, 3].map((figure) => (
        <Stack key={figure} gap={2}>
          <Skeleton height="12px" width="70%" />
          <Skeleton height="24px" width="80%" />
        </Stack>
      ))}
    </SimpleGrid>

    <Skeleton height="44px" borderRadius="12px" width={{ base: 'full', md: '340px' }} />

    <Stack gap={3}>
      {[0, 1, 2, 3, 4].map((row) => (
        <Box
          key={row}
          borderWidth="1px"
          borderColor="secondaryGray.200"
          borderRadius="16px"
          bg="white"
          _dark={{ bg: 'navy.700', borderColor: 'whiteAlpha.300' }}
          p={4}
        >
          <Stack gap={2}>
            <Skeleton height="36px" width="60%" borderRadius="12px" />
            <Skeleton height="16px" width="70%" />
            <Skeleton height="16px" width="45%" />
          </Stack>
        </Box>
      ))}
    </Stack>
  </Stack>
);

export default LeaderboardSkeleton;
