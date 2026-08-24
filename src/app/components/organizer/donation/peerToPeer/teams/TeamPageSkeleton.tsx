import type { ReactNode } from 'react';
import { Box, SimpleGrid, Skeleton, SkeletonCircle, Stack } from '@chakra-ui/react';

const Panel = ({ children }: { children: ReactNode }) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 4, md: 6 }}
  >
    {children}
  </Box>
);

/** Mirrors the two-column team page, so nothing shifts once the team and its members arrive. */
export const TeamPageSkeleton = () => (
  <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 4, md: 6 }} alignItems="start">
    <Stack gridColumn={{ lg: 'span 2' }} gap={{ base: 4, md: 6 }} minW={0}>
      <Panel>
        <Stack gap={3}>
          <Skeleton height="32px" width="65%" />
          <Skeleton height="20px" width="45%" borderRadius="full" />
          <Skeleton height="16px" width="55%" />
        </Stack>
      </Panel>

      <Panel>
        <Stack gap={4}>
          <Skeleton height="24px" width="40%" />
          {[0, 1, 2].map((member) => (
            <Stack key={member} direction="row" gap={4} align="center">
              <SkeletonCircle size="12" />
              <Stack flex="1" gap={2} minW={0}>
                <Skeleton height="18px" width="50%" />
                <Skeleton height="14px" width="30%" />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Panel>
    </Stack>

    <Stack gap={{ base: 4, md: 6 }} minW={0}>
      <Panel>
        <Stack gap={4}>
          <Skeleton height="36px" width="70%" />
          <Skeleton height="16px" width="45%" />
          <Skeleton height="12px" borderRadius="full" />
          <Skeleton height="48px" borderRadius="12px" />
        </Stack>
      </Panel>
    </Stack>
  </SimpleGrid>
);

export default TeamPageSkeleton;
