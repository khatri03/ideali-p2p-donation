import { Box, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

/** Mirrors the final dimensions of the join card so the layout does not shift when data arrives. */
export const FundraiserJoinSkeleton = () => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    p={{ base: 5, md: 8 }}
    boxShadow="sm"
  >
    <Stack gap={5}>
      <SkeletonText noOfLines={2} spacing={2} skeletonHeight="12px" />
      <Skeleton height="20px" width={{ base: '60%', md: '200px' }} borderRadius="md" />
      <Skeleton height="44px" borderRadius="12px" />
      <Skeleton height="20px" width={{ base: '50%', md: '180px' }} borderRadius="md" />
      <Skeleton height="44px" borderRadius="12px" />
      <Skeleton height="20px" width={{ base: '55%', md: '190px' }} borderRadius="md" />
      <SkeletonText noOfLines={4} spacing={3} skeletonHeight="12px" />
      <Skeleton height="44px" width={{ base: '100%', md: '180px' }} borderRadius="12px" />
    </Stack>
  </Box>
);

export default FundraiserJoinSkeleton;
