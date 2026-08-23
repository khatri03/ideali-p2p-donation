import { Box, Skeleton, SkeletonCircle, Stack } from '@chakra-ui/react';

/**
 * Mirrors the dimensions of a real page card, so the layout does not jump when the data arrives.
 */
export const MyFundraisingSkeleton = () => (
  <Stack gap={{ base: 4, md: 6 }}>
    {[0, 1].map((card) => (
      <Box
        key={card}
        bg="white"
        _dark={{ bg: 'navy.700' }}
        borderRadius="16px"
        boxShadow="sm"
        p={{ base: 4, md: 6 }}
      >
        <Stack direction={{ base: 'column', '2sm': 'row' }} gap={4} align={{ '2sm': 'center' }}>
          <SkeletonCircle size="16" />
          <Stack flex="1" gap={2} minW={0}>
            <Skeleton height="24px" width="60%" />
            <Skeleton height="16px" width="40%" />
          </Stack>
        </Stack>

        <Stack gap={3} mt={5}>
          <Skeleton height="12px" borderRadius="full" />
          <Skeleton height="16px" width="50%" />
          <Skeleton height="44px" borderRadius="12px" />
        </Stack>
      </Box>
    ))}
  </Stack>
);

export default MyFundraisingSkeleton;
