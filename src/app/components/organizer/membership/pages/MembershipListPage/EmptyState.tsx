import React from 'react';
import { Box, Button, Flex, Grid, GridItem, Icon, Text, VStack } from '@chakra-ui/react';
import { MdAdd, MdAutoAwesome } from 'react-icons/md';

interface Props {
  onCreateClick: () => void;
  canCreate?: boolean;
}

export default function EmptyState({ onCreateClick, canCreate = true }: Props) {
  return (
    <VStack spacing={6} py={12} px={6} align="center" w="full">
      <Flex w="56px" h="56px" borderRadius="xl" bg="blue.50" align="center" justify="center">
        <Icon as={MdAutoAwesome} boxSize={7} color="blue.400" />
      </Flex>

      <VStack spacing={4} align="center" maxW="500px" textAlign="center">
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Create your first membership type
        </Text>
        <Text fontSize="sm" color="gray.500" maxW="500px" lineHeight="tall" mx="auto">
          Membership types are the plans members sign up for. Set up a price,<br />
          branding, custom questions and a thank-you email — all in one guided flow.
        </Text>
      </VStack>

      <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={4} maxW="800px" w="full">
        {[
          { n: 1, title: 'Set the basics',     desc: 'Name, description, color and banner.' },
          { n: 2, title: 'Pricing & payments', desc: 'Choose billing cycle and accepted methods.' },
          { n: 3, title: 'Forms & email',       desc: 'Attach questions and craft a thank-you note.' },
        ].map(({ n, title, desc }) => (
          <GridItem key={n} bg="gray.200" borderRadius="xl" p={4} textAlign="left" borderWidth="1px" borderColor="gray.100">
            <Flex w="26px" h="26px" borderRadius="full" bg="blue.500" color="white" align="center" justify="center" fontSize="xs" fontWeight="bold" mb={3}>
              {n}
            </Flex>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={1}>{title}</Text>
            <Text fontSize="xs" color="gray.500" lineHeight="tall">{desc}</Text>
          </GridItem>
        ))}
      </Grid>

      {canCreate && (
        <VStack spacing={1}>
          <Button
            leftIcon={<Icon as={MdAdd} />}
            colorScheme="blue" size="md" borderRadius="lg" px={8}
            onClick={onCreateClick}
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
            transition="all 0.2s"
          >
            Create your first type
          </Button>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Takes about 2 minutes • You can save &amp; exit at any step.
          </Text>
        </VStack>
      )}
    </VStack>
  );
}
