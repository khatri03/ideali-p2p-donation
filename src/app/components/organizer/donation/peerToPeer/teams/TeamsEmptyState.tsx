import { Box, Button, Heading, Icon, Text } from '@chakra-ui/react';
import { MdGroups } from 'react-icons/md';
import { EMPTY_GUIDANCE, EMPTY_HEADING, START_FIRST_TEAM } from './teamCopy';

interface TeamsEmptyStateProps {
  /** Absent when the person looking cannot start one: teams are off, or they are not fundraising. */
  onStartTeam?: () => void;
  /** Shown in place of the action when there is a reason they cannot start one. */
  note?: string;
}

/**
 * A designed screen rather than a bare sentence. The first person to open a campaign that has teams
 * switched on sees this, so the one useful thing to offer them is the way to start the first team.
 */
export const TeamsEmptyState = ({ onStartTeam, note }: TeamsEmptyStateProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 6, md: 10 }}
    textAlign="center"
  >
    <Icon as={MdGroups} boxSize="40px" color="brand.500" mb={4} aria-hidden="true" />

    <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }} color="navy.700" _dark={{ color: 'white' }}>
      {EMPTY_HEADING}
    </Heading>

    <Text
      mt={2}
      mb={6}
      fontSize={{ base: 'sm', md: 'md' }}
      color="gray.600"
      _dark={{ color: 'gray.300' }}
      maxW="480px"
      mx="auto"
    >
      {EMPTY_GUIDANCE}
    </Text>

    {onStartTeam ? (
      <Button
        onClick={onStartTeam}
        colorScheme="brand"
        minH="44px"
        borderRadius="12px"
        cursor="pointer"
        w={{ base: 'full', md: 'auto' }}
      >
        {START_FIRST_TEAM}
      </Button>
    ) : (
      note && (
        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }} maxW="480px" mx="auto">
          {note}
        </Text>
      )
    )}
  </Box>
);

export default TeamsEmptyState;
