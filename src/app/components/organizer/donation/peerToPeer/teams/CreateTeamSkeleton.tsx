import { Box, Skeleton, Stack } from '@chakra-ui/react';

/** Mirrors the create form, so nothing shifts once the campaign it belongs to has loaded. */
export const CreateTeamSkeleton = () => (
  <Stack gap={{ base: 4, md: 6 }}>
    <Skeleton height="36px" width="50%" />
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
    >
      <Stack gap={5}>
        <Skeleton height="44px" borderRadius="12px" />
        <Skeleton height="44px" borderRadius="12px" />
        <Skeleton height="140px" borderRadius="12px" />
        <Skeleton height="44px" width="180px" borderRadius="12px" alignSelf="flex-end" />
      </Stack>
    </Box>
  </Stack>
);

export default CreateTeamSkeleton;
