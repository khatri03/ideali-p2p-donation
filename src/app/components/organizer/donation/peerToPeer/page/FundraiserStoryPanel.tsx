import { Box, Heading, Text } from '@chakra-ui/react';
import { STORY_HEADING } from './pageCopy';

interface FundraiserStoryPanelProps {
  story: string;
}

/**
 * The fundraiser's own words, rendered as text and never as markup. Chakra escapes children, so a
 * script tag pasted into a story appears on the page as the characters the fundraiser typed.
 */
export const FundraiserStoryPanel = ({ story }: FundraiserStoryPanelProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 4, md: 6 }}
  >
    <Heading
      as="h2"
      fontSize={{ base: 'md', md: 'lg' }}
      mb={3}
      color="navy.700"
      _dark={{ color: 'white' }}
    >
      {STORY_HEADING}
    </Heading>

    <Text
      fontSize={{ base: 'sm', md: 'md' }}
      color="gray.700"
      _dark={{ color: 'gray.200' }}
      whiteSpace="pre-wrap"
      lineHeight="1.7"
    >
      {story}
    </Text>
  </Box>
);

export default FundraiserStoryPanel;
