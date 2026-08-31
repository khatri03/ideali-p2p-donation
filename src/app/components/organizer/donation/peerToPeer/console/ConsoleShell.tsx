import { ReactNode } from 'react';
import { Box, Stack } from '@chakra-ui/react';

interface ConsoleShellProps {
  children: ReactNode;
  /** Narrower on a form, wider on a list. Both stay centred and both clear the fixed navbar. */
  maxW?: string;
}

/**
 * The frame both fundraiser console screens sit in.
 *
 * The top padding is the point of it: the member layout's navigation bar is fixed, so a screen that
 * starts at the top of the scrolling area passes underneath it and loses its own heading. Every other
 * screen in the product clears the bar the same way, and stating it once keeps the two console screens
 * from drifting apart from each other or from the rest.
 */
export const ConsoleShell = ({ children, maxW = '1000px' }: ConsoleShellProps) => (
  <Box
    as="main"
    w="100%"
    maxW={maxW}
    mx="auto"
    px={{ base: 4, md: 6 }}
    pt={{ base: '100px', md: '80px' }}
    pb={10}
  >
    <Stack gap={{ base: 4, md: 6 }}>{children}</Stack>
  </Box>
);

export default ConsoleShell;
