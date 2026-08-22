import type { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

interface PublicPageShellProps {
  children: ReactNode;
  /** Narrow for a single notice, wide for the two-column page. */
  maxWidth?: string;
}

/** The page frame every public peer-to-peer surface sits in, so they cannot drift apart. */
export const PublicPageShell = ({ children, maxWidth = '1200px' }: PublicPageShellProps) => (
  <Box
    minH="100dvh"
    bg="gray.50"
    _dark={{ bg: 'navy.900' }}
    px={{ base: 4, md: 6 }}
    py={{ base: 6, md: 10 }}
  >
    <Box maxW={maxWidth} mx="auto">
      {children}
    </Box>
  </Box>
);

export default PublicPageShell;
