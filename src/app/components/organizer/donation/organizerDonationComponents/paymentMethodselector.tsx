import React from 'react';
import { Box, SimpleGrid, VStack, Text, Image, Icon } from '@chakra-ui/react';
import { FaCreditCard, FaGoogle, FaUniversity } from 'react-icons/fa';

interface PaymentMethodSelectorProps {
  availablePaymentMethods: Array<{
    value: string;
    text: string;
    label: string;
    description: string;
    icon: string;
  }>;
  selectedMethod: string;
  onMethodChange: (value: string) => void;
  themeColor: string;
  textColor: string;
  subTextColor: string;
}

const PaymentMethodSelector = React.memo(
  ({
    availablePaymentMethods,
    selectedMethod,
    onMethodChange,
    themeColor,
    textColor,
    subTextColor,
  }: PaymentMethodSelectorProps) => {
    const getPaymentIcon = (label: string) => {
      if (
        label.toLowerCase().includes('credit') ||
        label.toLowerCase().includes('card')
      ) {
        return FaCreditCard;
      } else if (label.toLowerCase().includes('google')) {
        return FaGoogle;
      } else if (label.toLowerCase().includes('bank')) {
        return FaUniversity;
      }
      return FaCreditCard;
    };

    return (
      <Box>
        <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" mb={4}>
          Select Payment Method
        </Text>

        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={{ base: 2, md: 3 }}>
          {availablePaymentMethods.map((method, index) => (
            <Box
              key={method.value || `payment-${index}`}
              p={{ base: 3, md: 5 }}
              borderRadius="lg"
              borderWidth="2px"
              borderColor={
                selectedMethod === method.value ? '#033fb6' : 'gray.200'
              }
              bg={selectedMethod === method.value ? 'purple.50' : 'white'}
              cursor="pointer"
              onClick={() => onMethodChange(method.value)}
              transition="all 0.2s ease"
              textAlign="center"
              _hover={{
                borderColor: '#033fb6',
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
              minH={{ base: '80px', md: '100px' }}
            >
              <VStack spacing={{ base: 1, md: 2 }}>
                <Box
                  w={{ base: '36px', md: '48px' }}
                  h={{ base: '36px', md: '48px' }}
                  borderRadius="lg"
                  bg={selectedMethod === method.value ? '#033fb6' : 'gray.300'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {method.icon ? (
                    <Image
                      src={method.icon}
                      alt={method.label}
                      w={{ base: '20px', md: '28px' }}
                      h={{ base: '20px', md: '28px' }}
                      objectFit="contain"
                    />
                  ) : (
                    <Icon
                      as={getPaymentIcon(method.label)}
                      color={
                        selectedMethod === method.value
                          ? 'gray.700'
                          : 'gray.600'
                      }
                      boxSize={{ base: 4, md: 6 }}
                    />
                  )}
                </Box>
                <Text
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="semibold"
                  color={textColor}
                  noOfLines={2}
                >
                  {method.label}
                </Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  },
);

PaymentMethodSelector.displayName = 'PaymentMethodSelector';

export default PaymentMethodSelector;
