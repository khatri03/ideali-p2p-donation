import React from 'react';
import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react';

function MemberDashboard() {
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const secondaryColor = useColorModeValue('#A3AED0', '#A3AED0');

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Heading color={textColor} fontSize={{ base: '2xl', md: '3xl' }} mb={2}>
        Member Dashboard
      </Heading>
      <Text color={secondaryColor}>
        Welcome, Member. This is your single-menu dashboard.
      </Text>
    </Box>
  );
}

export default MemberDashboard;