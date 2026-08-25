import type { IconType } from 'react-icons';
import { Box, Heading, Icon, Text } from '@chakra-ui/react';

interface StandingsEmptyStateProps {
  icon: IconType;
  heading: string;
  guidance: string;
}

/**
 * A designed screen rather than a bare "no data" string. There is deliberately no action here: a
 * stranger reading a leaderboard cannot make supporters appear on it, so offering them a button would
 * be offering them nothing.
 */
export const StandingsEmptyState = ({ icon, heading, guidance }: StandingsEmptyStateProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 6, md: 10 }}
    textAlign="center"
  >
    <Icon as={icon} boxSize="40px" color="brand.500" mb={4} aria-hidden="true" />

    <Heading as="h3" fontSize={{ base: 'md', md: 'lg' }} color="navy.700" _dark={{ color: 'white' }}>
      {heading}
    </Heading>

    <Text
      mt={2}
      fontSize={{ base: 'sm', md: 'md' }}
      color="gray.600"
      _dark={{ color: 'gray.300' }}
      maxW="52ch"
      mx="auto"
    >
      {guidance}
    </Text>
  </Box>
);

export default StandingsEmptyState;
