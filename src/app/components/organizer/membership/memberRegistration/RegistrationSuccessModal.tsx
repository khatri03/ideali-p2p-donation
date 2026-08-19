import React from 'react';
import {
  Box, Button, Flex, Icon, Modal, ModalCloseButton, ModalContent,
  ModalOverlay, Text,
} from '@chakra-ui/react';
import { MdCheckCircle, MdPerson } from 'react-icons/md';

interface Props {
  isOpen: boolean;
  memberName: string;
  membershipName: string;
  onDone: () => void;
}

export default function RegistrationSuccessModal({ isOpen, memberName, membershipName, onDone }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onDone} isCentered size="md" closeOnOverlayClick={false}>
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" mx={4} overflow="hidden">
        

        {/* Close button — Modal's onClose is already wired to onDone, same as "Register Another Member" */}
        <ModalCloseButton zIndex={1} _focus={{ boxShadow: 'none' }} />

        {/* Top accent bar */}
        <Box h="6px" bgGradient="linear(to-r, #044bd9, teal.400)" />

        <Flex direction="column" align="center" px={8} pt={8} pb={6} textAlign="center">

          {/* Success icon */}
          <Flex
            w="72px"
            h="72px"
            borderRadius="full"
            bg="green.50"
            border="3px solid"
            borderColor="green.200"
            align="center"
            justify="center"
            mb={4}
            boxShadow="0 4px 16px rgba(72,187,120,0.25)"
          >
            <Icon as={MdCheckCircle} boxSize={10} color="green.500" />
          </Flex>

          <Text fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
            Registration Successful!
          </Text>
          <Text fontSize="sm" color="gray.500" mb={5} lineHeight="tall">
            <Text as="span" fontWeight="semibold" color="gray.700">{memberName}</Text>
            {' '}has been successfully registered for{' '}
            <Text as="span" fontWeight="semibold" color="#044bd9">{membershipName}</Text>.
          </Text>

          {/* Member badge */}
          <Flex
            align="center"
            gap={2}
            bg="blue.50"
            border="1px solid"
            borderColor="blue.100"
            borderRadius="xl"
            px={4}
            py={3}
            mb={6}
          >
            <Flex
              w="36px"
              h="36px"
              borderRadius="full"
              bg="#044bd9"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={MdPerson} boxSize={5} color="white" />
            </Flex>
            <Box textAlign="left">
              <Text fontSize="sm" fontWeight="semibold" color="gray.800">{memberName}</Text>
              <Text fontSize="xs" color="gray.500">{membershipName}</Text>
            </Box>
            <Icon as={MdCheckCircle} color="green.500" boxSize={5} ml="auto" />
          </Flex>

          <Button
            w="full"
            bg="#044bd9"
            color="white"
            borderRadius="xl"
            h="44px"
            fontSize="sm"
            fontWeight="bold"
            onClick={onDone}
            _hover={{ bg: '#0340b8' }}
            _active={{ bg: '#02308a' }}
          >
            Register Another Member
          </Button>
        </Flex>

      </ModalContent>
    </Modal>
  );
}
