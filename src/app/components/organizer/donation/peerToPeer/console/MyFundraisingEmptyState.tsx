import { Box, Button, Heading, Icon, Text } from '@chakra-ui/react';
import { MdVolunteerActivism } from 'react-icons/md';
import { EMPTY_ACTION, EMPTY_GUIDANCE, EMPTY_HEADING } from './consoleCopy';

interface MyFundraisingEmptyStateProps {
  onFindCampaign: () => void;
  /** Overridden by the supporter whose campaigns have all finished, who is not a beginner. */
  heading?: string;
  guidance?: string;
}

/**
 * A designed screen rather than a bare sentence, used for the two ways a supporter can reach this page
 * with nothing left to do: they have never fundraised, and their last campaign has finished. Both are
 * offered the one useful thing - the way to a campaign that is still taking supporter pages.
 */
export const MyFundraisingEmptyState = ({
  onFindCampaign,
  heading = EMPTY_HEADING,
  guidance = EMPTY_GUIDANCE,
}: MyFundraisingEmptyStateProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 6, md: 10 }}
    textAlign="center"
  >
    <Icon as={MdVolunteerActivism} boxSize="40px" color="brand.500" mb={4} aria-hidden="true" />

    <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }} color="navy.700" _dark={{ color: 'white' }}>
      {heading}
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
      {guidance}
    </Text>

    <Button
      onClick={onFindCampaign}
      colorScheme="brand"
      minH="44px"
      borderRadius="12px"
      cursor="pointer"
      w={{ base: 'full', md: 'auto' }}
    >
      {EMPTY_ACTION}
    </Button>
  </Box>
);

export default MyFundraisingEmptyState;
