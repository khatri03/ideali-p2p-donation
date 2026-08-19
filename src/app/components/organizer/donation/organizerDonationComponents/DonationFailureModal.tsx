import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Box,
  Text,
  VStack,
  Button,
  Icon,
} from "@chakra-ui/react";
import { MdError } from "react-icons/md";

interface DonationFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
  themeColor?: string;
}

const DonationFailureModal: React.FC<DonationFailureModalProps> = ({
  isOpen,
  onClose,
  errorMessage = "Something went wrong. Please try again.",
  themeColor = "#E53E3E", // Red color for error
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />

      <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
        {/* Header Section */}
        <Box
          bg={`linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`}
          pt={8}
          pb={6}
          px={6}
          textAlign="center"
        >
          <Box
            w="80px"
            h="80px"
            bg="white"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={4}
            boxShadow="0 8px 20px rgba(0,0,0,0.15)"
          >
            <Icon as={MdError} fontSize="4xl" color={themeColor} />
          </Box>

          <ModalHeader p={0} color="white" fontSize="2xl" fontWeight="bold">
            Donation Failed
          </ModalHeader>
        </Box>

        {/* Body */}
        <ModalBody pt={6} pb={2} px={6}>
          <VStack spacing={3}>
            <Text
              fontSize="md"
              color="gray.700"
              textAlign="center"
              fontWeight="medium"
            >
              We couldn't process your donation
            </Text>
            <Box
              bg="red.50"
              p={4}
              borderRadius="lg"
              border="1px solid"
              borderColor="red.200"
              w="full"
            >
              <Text fontSize="sm" color="red.700" textAlign="center">
                {errorMessage}
              </Text>
            </Box>
            <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
              Please check your payment details and try again. If the problem
              persists, contact support.
            </Text>
          </VStack>
        </ModalBody>

        {/* Footer */}
        <ModalFooter pt={2} pb={6} px={6} justifyContent="center" gap={3}>
          <Button
            colorScheme="red"
            variant="outline"
            size="lg"
            flex={1}
            borderRadius="xl"
            onClick={handleClose}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            transition="all 0.2s"
          >
            Close
          </Button>
          <Button
            colorScheme="blue"
            size="lg"
            flex={1}
            borderRadius="xl"
            onClick={handleClose}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            transition="all 0.2s"
          >
            Try Again
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DonationFailureModal;
