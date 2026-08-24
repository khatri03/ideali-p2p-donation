import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import CopyLinkButton from './CopyLinkButton';
import { SHARE_HEADING } from './pageCopy';

interface SharePanelProps {
  displayName: string;
  shareUrl: string;
}

/**
 * Sharing is how a peer-to-peer page reaches anybody, so the address is always readable even when the
 * clipboard is unavailable - a locked-down browser must not leave the fundraiser with nothing to send.
 */
export const SharePanel = ({ displayName, shareUrl }: SharePanelProps) => (
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
      {SHARE_HEADING(displayName)}
    </Heading>

    <Stack gap={3} align={{ md: 'flex-start' }}>
      <Box
        bg="gray.50"
        _dark={{ bg: 'navy.800' }}
        borderRadius="10px"
        px={3}
        py={2}
        overflowX="auto"
        w="100%"
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
