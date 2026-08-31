import { useState } from 'react';
import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { SHARE_COPY_LINK, SHARE_LINK_COPIED, SHARE_LINK_COPY_FAILED } from './pageCopy';

interface CopyLinkButtonProps {
  shareUrl: string;
  width?: Record<string, string> | string;
}

type CopyOutcome = 'idle' | 'copied' | 'failed';

/**
 * Copying is the same act wherever it is offered, so it behaves the same everywhere: a clipboard the
 * browser refuses is reported rather than swallowed, because a fundraiser who thinks they copied a
 * link and pastes nothing has lost the donation.
 *
 * A refusal also puts the address on screen. Telling somebody to copy it from the address bar is only
 * true on the page itself - on the console the address bar holds the console, not the page being
 * shared - so the fallback shows the exact text the clipboard would have taken.
 */
export const CopyLinkButton = ({ shareUrl, width = { base: 'full', md: 'auto' } }: CopyLinkButtonProps) => {
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
    <Stack gap={2} w={width}>
      <Button
        onClick={handleCopy}
        variant="outline"
        colorScheme="purple"
        isDisabled={!shareUrl}
        minH="44px"
        borderRadius="12px"
        cursor={shareUrl ? 'pointer' : 'not-allowed'}
        w="100%"
      >
        {outcome === 'copied' ? SHARE_LINK_COPIED : SHARE_COPY_LINK}
      </Button>

      {outcome === 'failed' && (
        <Stack gap={2}>
          <Text fontSize="sm" color="red.500" role="alert">
            {SHARE_LINK_COPY_FAILED}
          </Text>

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
        </Stack>
      )}
    </Stack>
  );
};

export default CopyLinkButton;
