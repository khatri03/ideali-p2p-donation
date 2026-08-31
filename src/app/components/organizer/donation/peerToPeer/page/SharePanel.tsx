import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import CopyLinkButton from './CopyLinkButton';
import { SHARE_HEADING } from './pageCopy';

interface SharePanelProps {
  shareUrl: string;
  /** Overrides the heading for surfaces that share something other than one person's page. */
  heading?: string;
  /**
   * Where this panel sits in the page outline. A panel that is a section of the screen is an h2; one
   * nested inside a card that already has its own heading is an h3, so the outline a screen reader
   * announces matches what the eye sees.
   */
  headingLevel?: 'h2' | 'h3';
  /** Flattens the panel for use inside a card, which already carries the surface and the shadow. */
  isNested?: boolean;
}

/**
 * Sharing is how a peer-to-peer page reaches anybody, so the address is always readable even when the
 * clipboard is unavailable - a locked-down browser must not leave the fundraiser with nothing to send.
 */
export const SharePanel = ({
  shareUrl,
  heading,
  headingLevel = 'h2',
  isNested = false,
}: SharePanelProps) => (
  <Box
    bg={isNested ? 'secondaryGray.300' : 'white'}
    _dark={{ bg: isNested ? 'whiteAlpha.100' : 'navy.700' }}
    borderRadius={isNested ? '14px' : '16px'}
    boxShadow={isNested ? 'none' : 'sm'}
    p={isNested ? 4 : { base: 4, md: 6 }}
  >
    <Heading
      as={headingLevel}
      fontSize={{ base: 'sm', md: 'md' }}
      mb={3}
      color="navy.700"
      _dark={{ color: 'white' }}
    >
      {heading ?? SHARE_HEADING}
    </Heading>

    <Stack
      direction={{ base: 'column', md: 'row' }}
      gap={3}
      align={{ base: 'stretch', md: 'center' }}
    >
      <Box
        bg="gray.50"
        _dark={{ bg: 'navy.800' }}
        borderRadius="10px"
        px={3}
        py={2}
        overflowX="auto"
        flex="1"
        minW={0}
      >
        <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.200' }} whiteSpace="nowrap">
          {shareUrl}
        </Text>
      </Box>

      <CopyLinkButton shareUrl={shareUrl} />
    </Stack>
  </Box>
);

export default SharePanel;
