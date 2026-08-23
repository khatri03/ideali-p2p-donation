import { Box, Button, Heading, Icon, Text } from '@chakra-ui/react';
import { MdVolunteerActivism } from 'react-icons/md';
import { EMPTY_ACTION, EMPTY_GUIDANCE, EMPTY_HEADING } from './consoleCopy';

interface MyFundraisingEmptyStateProps {
  onFindCampaign: () => void;
}

/**
 * A designed screen rather than a bare sentence: somebody arrives here when their only page has been
 * removed, and the one useful thing to offer them is the way back to a campaign.
 */
export const MyFundraisingEmptyState = ({ onFindCampaign }: MyFundraisingEmptyStateProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 6, md: 10 }}
    textAlign="center"
  >
    <Icon as={MdVolunteerActivism} boxSize="40px" color="brand.500" mb={4} />

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
