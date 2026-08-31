import type { ReactNode } from 'react';
import { Box, Button, Heading, Icon, Stack, Text } from '@chakra-ui/react';
import { MdInfoOutline } from 'react-icons/md';

interface FundraiserPageNoticeProps {
  heading: string;
  message: string;
  action?: ReactNode;
  /**
   * An h1 when the notice is the whole screen, which is how most of its callers use it. A screen that
   * keeps its own heading and shows the notice beneath it passes h2, so the page never announces two
   * first-level headings and a screen reader can still tell which one owns the screen.
   */
  headingLevel?: 'h1' | 'h2';
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * The single designed surface behind every reason a fundraiser page cannot take money: not found,
 * waiting for approval, withdrawn, or a campaign that has finished. One component so those four never
 * drift apart visually, and so none of them can degrade into a bare error string.
 */
export const FundraiserPageNotice = ({
  heading,
  message,
  action,
  headingLevel = 'h1',
  onRetry,
  retryLabel,
}: FundraiserPageNoticeProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 6, md: 10 }}
    textAlign="center"
  >
    <Stack gap={4} align="center" maxW="46ch" mx="auto">
      <Icon as={MdInfoOutline} boxSize="40px" color="brand.500" aria-hidden="true" />

      <Heading
        as={headingLevel}
        fontSize={{ base: 'lg', md: 'xl' }}
        color="navy.700"
        _dark={{ color: 'white' }}
      >
        {heading}
      </Heading>

      <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
        {message}
      </Text>

      {action}

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          colorScheme="purple"
          minH="44px"
          borderRadius="12px"
          cursor="pointer"
          w={{ base: 'full', md: 'auto' }}
        >
          {retryLabel}
        </Button>
      )}
    </Stack>
  </Box>
);

export default FundraiserPageNotice;
