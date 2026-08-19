import React from 'react';
import { Box, Container, Flex, HStack, Text, useToast } from '@chakra-ui/react';

interface DonationProgressIndicatorProps {
  currentStep: 1 | 2;
  setCurrentStep: (step: 1 | 2) => void;
  donationAmount: string | number;
  themeColor: string;
  subTextColor: string;
}

const DonationProgressIndicator: React.FC<DonationProgressIndicatorProps> = ({
  currentStep,
  setCurrentStep,
  donationAmount,
  themeColor,
  subTextColor,
}) => {
  const toast = useToast();

  const handleStep2Click = () => {
    if (donationAmount) {
      setCurrentStep(2);
    } else {
      toast({
        title: 'Please select an amount',
        description: 'You need to select a donation amount first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box bg="white" py={4} boxShadow="sm">
      <Container maxW="1200px">
        <HStack spacing={2} align="center" mb={3}>
          <Box
            flex={1}
            h="4px"
            borderRadius="full"
            bg={currentStep >= 1 ? themeColor : "gray.200"}
            transition="all 0.3s ease"
            cursor="pointer"
            onClick={() => setCurrentStep(1)}
            _hover={{
              bg: currentStep >= 1 ? themeColor : "gray.300"
            }}
          />
          <Box
            flex={1}
            h="4px"
            borderRadius="full"
            bg={currentStep >= 2 ? themeColor : "gray.200"}
            transition="all 0.3s ease"
            cursor="pointer"
            onClick={handleStep2Click}
            _hover={{
              bg: currentStep >= 2 ? themeColor : "gray.300"
            }}
          />
        </HStack>
        <Flex justify="space-between" align="center">
          <Box
            cursor="pointer"
            onClick={() => setCurrentStep(1)}
            transition="all 0.2s ease"
            _hover={{
              transform: "translateY(-1px)"
            }}
          >
            <Text
              fontSize="sm"
              fontWeight={currentStep === 1 ? "bold" : "medium"}
              color={currentStep >= 1 ? themeColor : subTextColor}
              transition="all 0.3s ease"
            >
              1. Select Amount
            </Text>
          </Box>
          <Box
            cursor="pointer"
            onClick={handleStep2Click}
            transition="all 0.2s ease"
            _hover={{
              transform: "translateY(-1px)"
            }}
          >
            <Text
              fontSize="sm"
              fontWeight={currentStep === 2 ? "bold" : "medium"}
              color={currentStep >= 2 ? themeColor : subTextColor}
              transition="all 0.3s ease"
            >
              2. Payment Details
            </Text>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default DonationProgressIndicator;
