import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function MembershipHeroHeader({ eyebrow, title, description, action }: Props) {
  return (
    <Box
      bgGradient="linear(135deg, #3b4fcf 0%, #5b6ef5 60%, #7c8cf8 100%)"
      px={{ base: 4, md: 8 }}
      pt={{ base: 4, md: 6 }}
      pb={{ base: 5, md: 8 }}
      borderRadius="xl"
      mx={{ base: 2, md: 4 }}
      mt={2}
      boxShadow="0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)"
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" top="-30px" right="120px" w="180px" h="180px" borderRadius="full" bg="whiteAlpha.100" />
      <Box position="absolute" bottom="-40px" right="-20px" w="220px" h="220px" borderRadius="full" bg="whiteAlpha.100" />

      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        flexDirection={{ base: 'column', md: 'row' }}
        gap={{ base: 4, md: 0 }}
        position="relative"
      >
        <Box>
          <Text
            fontSize="xs" fontWeight="semibold" color="whiteAlpha.700"
            letterSpacing="widest" textTransform="uppercase" mb={1}
          >
            {eyebrow}
          </Text>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="white" mb={1}>
            {title}
          </Text>
          <Text fontSize="sm" color="whiteAlpha.800" maxW="460px" lineHeight="tall">
            {description}
          </Text>
        </Box>

        {action && (
          <Box flexShrink={0} mt={{ base: 0, md: 1 }}>
            {action}
          </Box>
        )}
      </Flex>
    </Box>
  );
}
