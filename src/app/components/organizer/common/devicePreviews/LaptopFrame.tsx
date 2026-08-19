import React, { useState } from 'react';
import { Box, Flex, HStack, Grid, IconButton, Tooltip } from '@chakra-ui/react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

interface LaptopFrameProps {
  /** Render prop — receives isDarkMode so content can theme itself */
  children: (isDarkMode: boolean) => React.ReactNode;
  /** URL shown in the browser address bar */
  urlText?: string;
}

/**
 * Reusable laptop device frame.
 * Owns the dark-mode toggle, lid, camera, browser chrome, keyboard, trackpad.
 * Each module passes its own page content via the render-prop children.
 *
 * Usage:
 *   <LaptopFrame urlText="https://my-module.ideali.com">
 *     {(isDarkMode) => <MyModuleDesktopContent isDarkMode={isDarkMode} />}
 *   </LaptopFrame>
 */
export default function LaptopFrame({ children, urlText = 'https://ideali.com' }: LaptopFrameProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const bodyBg    = isDarkMode ? '#111113'  : '#f7fafc';
  const subText   = isDarkMode ? 'gray.400' : 'gray.600';
  const cardBg    = isDarkMode ? 'gray.800' : 'white';
  const cardBorder= isDarkMode ? 'gray.700' : 'gray.200';
  const navBorder = isDarkMode ? 'gray.800' : 'gray.100';
  const keyBg     = isDarkMode ? 'gray.700' : 'white';
  const keyBorder = isDarkMode ? 'gray.600' : 'gray.300';

  return (
    <Flex w="100%" h="100%" bg="#f7fafc" align="center" justify="center" py={6}>
      <Box
        position="relative"
        w="100%"
        maxW="650px"
        sx={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}
      >
        {/* Dark mode toggle */}
        <Tooltip label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="left">
          <IconButton
            aria-label="Toggle dark mode"
            icon={isDarkMode ? <MdLightMode /> : <MdDarkMode />}
            onClick={() => setIsDarkMode((v) => !v)}
            position="absolute"
            top="-12px"
            right="-12px"
            zIndex={50}
            size="sm"
            colorScheme={isDarkMode ? 'yellow' : 'purple'}
            borderRadius="full"
            boxShadow="lg"
          />
        </Tooltip>

        {/* Laptop lid */}
        <Box
          bg="gray.900"
          borderRadius="16px"
          p={2}
          border="1px solid"
          borderColor="gray.800"
          position="relative"
          overflow="hidden"
        >
          {/* Lid glare */}
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(to-b, rgba(255,255,255,0.06), rgba(0,0,0,0))"
            pointerEvents="none"
          />

          {/* Camera */}
          <HStack
            position="absolute"
            top="19px"
            left="50%"
            transform="translateX(-50%)"
            spacing="4px"
            zIndex={20}
          >
            <Box w="32px" h="4px" borderRadius="full" bg="blackAlpha.700" border="1px solid" borderColor="blackAlpha.600" />
            <Box w="6px"  h="6px" borderRadius="full" bg="black" border="1px solid" borderColor="whiteAlpha.300" boxShadow="inset 0 0 0 2px rgba(0,0,0,0.6)" />
            <Box w="4px"  h="4px" borderRadius="full" bg="black" border="1px solid" borderColor="whiteAlpha.300" />
          </HStack>

          {/* Screen */}
          <Box
            bg={bodyBg}
            borderRadius="12px"
            overflow="hidden"
            border="1px solid"
            borderColor={isDarkMode ? 'gray.700' : 'gray.300'}
            h={{ base: '40vh', md: '45vh', lg: '48vh' }}
          >
            {/* Browser chrome */}
            <Flex
              h="28px"
              bg={isDarkMode ? 'gray.900' : 'gray.100'}
              borderBottom="1px solid"
              borderColor={navBorder}
              alignItems="center"
              px={2}
              gap={2}
            >
              <HStack spacing={1}>
                <Box w="8px" h="8px" borderRadius="full" bg="#FF5F56" />
                <Box w="8px" h="8px" borderRadius="full" bg="#FFBD2E" />
                <Box w="8px" h="8px" borderRadius="full" bg="#27C93F" />
              </HStack>
              <Box
                flex="1"
                mx={2}
                px={2}
                py={0.5}
                bg={isDarkMode ? 'gray.800' : 'white'}
                borderRadius="md"
                fontSize="2xs"
                color={subText}
                border="1px solid"
                borderColor={cardBorder}
              >
                {urlText}
              </Box>
            </Flex>

            {/* Scrollable page content slot */}
            <Box
              h="calc(100% - 28px)"
              overflowY="auto"
              bg={bodyBg}
              sx={{
                '::-webkit-scrollbar': { width: '6px' },
                '::-webkit-scrollbar-track': { bg: isDarkMode ? 'gray.900' : 'gray.100' },
                '::-webkit-scrollbar-thumb': { bg: isDarkMode ? 'gray.600' : 'gray.400', borderRadius: 'full' },
              }}
            >
              {children(isDarkMode)}
            </Box>
          </Box>
        </Box>

        {/* Hinge */}
        <Box
          h="10px"
          mt="4px"
          mx="auto"
          w="70%"
          borderRadius="6px"
          bgGradient={isDarkMode ? 'linear(to-b, gray.700, gray.900)' : 'linear(to-b, gray.300, gray.500)'}
          border="1px solid"
          borderColor={isDarkMode ? 'gray.700' : 'gray.400'}
        />

        {/* Keyboard base */}
        <Box
          mt="6px"
          borderRadius="14px"
          bgGradient={isDarkMode ? 'linear(to-b, #2b2b2b, #1c1c1c)' : 'linear(to-b, #f5f5f7, #dcdde1)'}
          border="1px solid"
          borderColor={isDarkMode ? 'gray.700' : 'gray.300'}
          px={5}
          pt={5}
          pb={6}
        >
          <Grid templateColumns="repeat(12, 1fr)" gap={1} mb={4}>
            {Array.from({ length: 36 }).map((_, i) => (
              <Box key={i} h="16px" borderRadius="4px" bg={keyBg} border="1px solid" borderColor={keyBorder} />
            ))}
          </Grid>
          <HStack spacing={1.5} mb={3} justify="center">
            <Box w="16%" h="16px" borderRadius="4px"  bg={keyBg} border="1px solid" borderColor={keyBorder} />
            <Box w="40%" h="16px" borderRadius="6px"  bg={keyBg} border="1px solid" borderColor={keyBorder} />
            <Box w="16%" h="16px" borderRadius="4px"  bg={keyBg} border="1px solid" borderColor={keyBorder} />
          </HStack>
          <Box
            mx="auto"
            w="32%"
            h="45px"
            borderRadius="10px"
            bg={isDarkMode ? 'gray.800' : 'white'}
            border="1px solid"
            borderColor={keyBorder}
            boxShadow={isDarkMode ? 'inset 0 2px 4px rgba(0,0,0,0.35)' : 'inset 0 2px 4px rgba(0,0,0,0.1)'}
          />
        </Box>

        {/* Base shadow */}
        <Box mt="6px" h="6px" w="75%" mx="auto" borderRadius="full" bgGradient="radial(gray.900, transparent)" opacity={0.2} />
      </Box>
    </Flex>
  );
}
