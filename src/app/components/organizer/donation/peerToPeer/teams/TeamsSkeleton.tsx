import { Box, SimpleGrid, Skeleton, Stack } from '@chakra-ui/react';

/** Mirrors the dimensions of a real team card, so the grid does not jump when the data arrives. */
export const TeamsSkeleton = () => (
  <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={{ base: 4, md: 6 }}>
    {[0, 1, 2].map((card) => (
      <Box
        key={card}
        bg="white"
        _dark={{ bg: 'navy.700' }}
        borderRadius="16px"
        boxShadow="sm"
        p={{ base: 4, md: 6 }}
      >
        <Stack gap={3}>
          <Skeleton height="24px" width="70%" />
          <Skeleton height="20px" width="50%" borderRadius="full" />
          <Skeleton height="16px" />
          <Skeleton height="16px" width="80%" />
          <Skeleton height="28px" width="60%" />
          <Skeleton height="12px" borderRadius="full" />
          <Skeleton height="44px" borderRadius="12px" mt={2} />
        </Stack>
      </Box>
    ))}
  </SimpleGrid>
);

export default TeamsSkeleton;
