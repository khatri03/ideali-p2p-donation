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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor?: string;
  campaignId?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  themeColor = "#3182CE", // fallback color
  campaignId,
}) => {
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    if (campaignId) {
      // Navigate back to the campaign donation page and force reload to reset all fields
      navigate(`/donate/${campaignId}`, { replace: true });
      // Force page reload to reset all form fields
      window.location.reload();
    } else {
      // Fallback to donation list if no campaign ID
      navigate("/organizer/donation/manage-donation-module", {
        state: { refresh: true },
      });
    }
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
            <Text fontSize="4xl">✓</Text>
          </Box>

          <ModalHeader p={0} color="white" fontSize="2xl" fontWeight="bold">
            Donation Successful!
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
              Thank you for your generous donation
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Your contribution makes a real difference and helps us achieve our
              goals.
            </Text>
          </VStack>
        </ModalBody>

        {/* Footer */}
        <ModalFooter pt={2} pb={6} px={6} justifyContent="center">
          <Button
            colorScheme="blue"
            size="lg"
            w="full"
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SuccessModal;
