import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { EmailIcon } from '@chakra-ui/icons';
import mailCheck from "../../../assets/img/auth/mailCheck.svg"; 
import { Image } from "@chakra-ui/react";

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  email,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxW="400px" borderRadius="xl" p={3}>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} py={4}>
            {/* Email Icon */}
             <Image
              src={mailCheck}
              color="purple.500"
              bg="purple.50"
              p={3}
              borderRadius="full"
            />
              

            {/* Heading */}
            <Text
              fontSize="xl"
              fontWeight="bold"
              color={headingColor}
              textAlign="center"
            >
              Check Your Email
            </Text>

            {/* Description */}
            <Text
              fontSize="sm"
              color={textColor}
              textAlign="center"
              px={4}
            >
              A welcome mail has been sent to your email address.
              Please confirm to continue.
            </Text>

            {/* Got It Button */}
            <Button
              colorScheme="purple"
              size="md"
              w="180px"
              onClick={onClose}
              bgGradient="linear(to-r, purple.500, blue.500)"
              _hover={{
                bgGradient: "linear(to-r, purple.600, blue.600)",
              }}
              mt={2}
            >
              Got it
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EmailConfirmationModal;