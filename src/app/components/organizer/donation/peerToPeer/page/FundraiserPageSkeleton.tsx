import { Box, Skeleton, SkeletonCircle, SkeletonText, SimpleGrid, Stack } from '@chakra-ui/react';

const panelStyle = {
  bg: 'white',
  _dark: { bg: 'navy.700' },
  borderRadius: '16px',
  boxShadow: 'sm',
  p: { base: 4, md: 6 },
} as const;

/**
 * Mirrors the final layout of the fundraiser page, both columns included, so nothing jumps when the
 * real numbers arrive.
 */
export const FundraiserPageSkeleton = () => (
  <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 4, md: 6 }} alignItems="start">
    <Stack gridColumn={{ lg: 'span 2' }} gap={{ base: 4, md: 6 }}>
      <Box {...panelStyle}>
        <Stack direction={{ base: 'column', '2sm': 'row' }} gap={4} align={{ '2sm': 'center' }}>
          <SkeletonCircle size="72px" />
          <Stack flex="1" gap={3}>
            <Skeleton height="24px" width={{ base: '70%', md: '260px' }} borderRadius="md" />
            <Skeleton height="16px" width={{ base: '55%', md: '200px' }} borderRadius="md" />
          </Stack>
        </Stack>
      </Box>

      <Box {...panelStyle}>
        <Skeleton height="20px" width="180px" borderRadius="md" mb={4} />
        <SkeletonText noOfLines={5} spacing={3} skeletonHeight="12px" />
      </Box>

      <Box {...panelStyle}>
        <Skeleton height="20px" width="180px" borderRadius="md" mb={4} />
        <Stack gap={4}>
          {[0, 1, 2].map((row) => (
            <Stack key={row} direction="row" align="center" gap={3}>
              <SkeletonCircle size="40px" />
              <Skeleton height="16px" flex="1" borderRadius="md" />
              <Skeleton height="16px" width="64px" borderRadius="md" />
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>

    <Box {...panelStyle} position={{ lg: 'sticky' }} top={{ lg: 6 }}>
      <Stack gap={4}>
        <Skeleton height="36px" width="60%" borderRadius="md" />
        <Skeleton height="12px" borderRadius="full" />
        <Skeleton height="16px" width="50%" borderRadius="md" />
        <Skeleton height="48px" borderRadius="12px" />
        <Skeleton height="16px" width="70%" borderRadius="md" />
      </Stack>
    </Box>
  </SimpleGrid>
);

export default FundraiserPageSkeleton;
