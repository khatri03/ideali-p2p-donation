import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@chakra-ui/react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

interface PhoneFrameProps {
  /** Render prop — receives isDarkMode so content can theme itself */
  children: (isDarkMode: boolean) => React.ReactNode;
}

/**
 * Reusable phone device frame.
 * Owns the dark-mode toggle, outer shell, notch, and scroll container.
 * Each module passes its own inner content via the render-prop children.
 *
 * Usage:
 *   <PhoneFrame>
 *     {(isDarkMode) => <MyModuleMobileContent isDarkMode={isDarkMode} />}
 *   </PhoneFrame>
 */
export default function PhoneFrame({ children }: PhoneFrameProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const shellBg     = isDarkMode ? 'linear-gradient(180deg, #1a1a1a, #111113)' : 'linear-gradient(180deg, #f5f5f5, #e0e0e0)';
  const innerBorder = isDarkMode ? 'gray.700' : 'gray.900';

  return (
    <Box position="relative">
      {/* Dark mode toggle */}
      <Tooltip label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="left">
        <IconButton
          aria-label="Toggle dark mode"
          icon={isDarkMode ? <MdLightMode /> : <MdDarkMode />}
          onClick={() => setIsDarkMode((v) => !v)}
          position="absolute"
          top="-10px"
          right="-10px"
          zIndex={20}
          size="sm"
          colorScheme={isDarkMode ? 'yellow' : 'purple'}
          borderRadius="full"
          boxShadow="lg"
        />
      </Tooltip>

      {/* Outer shell */}
      <Box
        position="relative"
        w="300px"
        h="580px"
        borderRadius="50px"
        bg="grey"
        p="4px"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box
          position="relative"
          w="100%"
          h="100%"
          bg={shellBg}
          borderRadius="46px"
          overflow="hidden"
          borderWidth="3px"
          borderColor={innerBorder}
          boxShadow="inset 0 0 20px rgba(0,0,0,0.4)"
        >
          {/* Notch */}
          <Box
            position="absolute"
            top="6px"
            left="50%"
            transform="translateX(-50%)"
            w="90px"
            h="22px"
            bg="black"
            borderRadius="full"
            zIndex={10}
          />

          {/* Scrollable content slot */}
          <Box
            position="absolute"
            top="0"
            bottom="0"
            left="0"
            right="0"
            overflowY="auto"
            sx={{ '::-webkit-scrollbar': { display: 'none' } }}
          >
            {children(isDarkMode)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
