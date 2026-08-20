import { Box, Divider, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

/**
 * Mirrors the final dimensions of the settings card so the layout does not shift when data arrives.
 */
export const PeerToPeerSettingsSkeleton = () => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    p={{ base: 4, md: 6 }}
    boxShadow="sm"
  >
    <Stack gap={4}>
      <Skeleton height="24px" width={{ base: '70%', md: '260px' }} borderRadius="md" />
      <SkeletonText noOfLines={2} spacing={3} skeletonHeight="12px" />
      <Skeleton height="52px" borderRadius="12px" />
      <Divider />
      <Skeleton height="72px" borderRadius="12px" />
      <Skeleton height="72px" borderRadius="12px" />
      <Skeleton height="72px" borderRadius="12px" />
      <Skeleton height="72px" borderRadius="12px" />
      <Skeleton height="44px" width={{ base: '100%', md: '180px' }} borderRadius="12px" />
    </Stack>
  </Box>
);

export default PeerToPeerSettingsSkeleton;
