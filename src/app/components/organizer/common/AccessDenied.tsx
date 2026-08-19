import { Box, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { MdLock } from 'react-icons/md';
import { useColorModeValue } from '@chakra-ui/react';

export default function AccessDenied() {
  const bg        = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const subText   = useColorModeValue('gray.500', 'gray.400');

  return (
    <Flex align="center" justify="center" minH="70vh" w="100%">
      <Box
        bg={bg}
        borderRadius="2xl"
        boxShadow="md"
        px={10}
        py={12}
        textAlign="center"
        maxW="420px"
        w="100%"
      >
        <VStack spacing={4}>
          <Flex
            align="center"
            justify="center"
            bg="red.50"
            borderRadius="full"
            w="72px"
            h="72px"
          >
            <Icon as={MdLock} color="red.400" boxSize={8} />
          </Flex>
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            Access Denied
          </Text>
          <Text fontSize="sm" color={subText} maxW="300px">
            You don't have permission to access any section. Please contact your administrator to get the required permissions.
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
