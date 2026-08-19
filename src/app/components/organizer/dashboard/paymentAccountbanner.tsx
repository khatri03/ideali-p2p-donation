import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Button, Icon } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Image } from "@chakra-ui/react";
import dollar from "../../../../assets/img/organizer/dashboard/dollar.svg"; 

interface PaymentAccountBannerProps {
  onSetupClick?: () => void;
  showBanner?: boolean;
}

// Slide in from right animation
const slideInFromRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const paymentAccountbanner: React.FC<PaymentAccountBannerProps> = ({ 
  onSetupClick,
  showBanner = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showBanner) {
      // Small delay before showing to ensure smooth animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showBanner]);

  if (!showBanner || !isVisible) return null;

  return (
    <Box
      position="relative"
      animation={`${slideInFromRight} 0.6s ease-out`}
    >
      <Flex
        align="center"
        justify="space-between"
        bg="linear-gradient(135deg, #FFF5E6 0%, #FFF9F0 100%)"
        border="1px solid"
        borderColor="orange.200"
        borderRadius="lg"
        px={3}
        py={4}
        boxShadow="sm"
        gap={3}
        flexDirection={{ base: 'column', md: 'row' }}
        _hover={{
          boxShadow: 'md',
          transform: 'translateY(-1px)',
        }}
        transition="all 0.3s ease"
      >
        {/* Icon and Text Section */}
        <Flex
          align="center"
          gap={2.5}
          flex={{ base: '1', md: 'auto' }}
          w={{ base: '100%', md: 'auto' }}
        >
          <Image
            src={dollar}
            alt="Payment Icon"
            boxSize={8}
          />

          {/* Text Content */}
          <Box flex="1">
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="gray.800"
              mb={0}
              lineHeight="1.3"
            >
              Payment account required
            </Text>
            <Text
              fontSize="2xs"
              color="gray.600"
              lineHeight="1.3"
              mt={0.5}
            >
              Setup your payment account to start accepting donations
            </Text>
          </Box>
        </Flex>

        {/* Button Section */}
        <Button
          bg="#F59F0A"
          color="white"
          size="xs"
          px={4}
          py={2}
          h="auto"
          borderRadius="md"
          fontWeight="bold"
          fontSize="2xs"
          onClick={onSetupClick}
          _hover={{
            bg: '#F59F0A',
            transform: 'scale(1.05)',
            boxShadow: '0 4px 15px rgba(251, 140, 0, 0.4)',
          }}
          _active={{
            transform: 'scale(0.98)',
          }}
          transition="all 0.2s ease"
          boxShadow="0 2px 8px rgba(251, 140, 0, 0.3)"
          whiteSpace="nowrap"
        >
          Setup payment account
        </Button>
      </Flex>
    </Box>
  );
};

export default paymentAccountbanner;