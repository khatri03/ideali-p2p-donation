import { useState } from 'react';
import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { SHARE_COPY_LINK, SHARE_HEADING, SHARE_LINK_COPIED, SHARE_LINK_COPY_FAILED } from './pageCopy';

interface SharePanelProps {
  displayName: string;
  shareUrl: string;
}

type CopyOutcome = 'idle' | 'copied' | 'failed';

/**
 * Sharing is how a peer-to-peer page reaches anybody, so the address is always readable even when the
 * clipboard is unavailable - a locked-down browser must not leave the fundraiser with nothing to send.
 */
export const SharePanel = ({ displayName, shareUrl }: SharePanelProps) => {
  const [outcome, setOutcome] = useState<CopyOutcome>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setOutcome('copied');
    } catch {
      setOutcome('failed');
    }
  };

  return (
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

      <Stack gap={3}>
        <Box
          bg="gray.50"
          _dark={{ bg: 'navy.800' }}
          borderRadius="10px"
          px={3}
          py={2}
          overflowX="auto"
        >
          <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.200' }} whiteSpace="nowrap">
            {shareUrl}
          </Text>
        </Box>

        <Button
          onClick={handleCopy}
          variant="outline"
          colorScheme="purple"
          minH="44px"
          borderRadius="12px"
          cursor="pointer"
          w={{ base: 'full', md: 'auto' }}
          alignSelf={{ md: 'flex-start' }}
        >
          {outcome === 'copied' ? SHARE_LINK_COPIED : SHARE_COPY_LINK}
        </Button>

        {outcome === 'failed' && (
          <Text fontSize="sm" color="red.500" role="alert">
            {SHARE_LINK_COPY_FAILED}
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default SharePanel;
