import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Button,
  Flex,
  HStack,
  Image,
  PinInput,
  PinInputField,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdOutlineEmail, MdArrowBack } from 'react-icons/md';
import logo from '../../../assets/img/logo/idealiLogo.svg';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onBackToSignIn?: () => void;
  isVerifying?: boolean;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  onBackToSignIn,
  isVerifying = false,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const bgColor = useColorModeValue('white', '#1B254B');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('#E0E5F2', '#2D3748');

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
    }
  }, [isOpen]);

  const handleCodeChange = (val: string) => {
    setCode(val);
    if (error) setError('');
  };

  const handleVerify = async () => {
    if (code.length === 6) {
      try {
        await onVerify(code);
      } catch (err: any) {
        setError(err?.message || 'Invalid verification code. Please try again.');
        setCode('');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="full"
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay />
      <ModalContent
        bg="transparent"
        boxShadow="none"
        m={0}
        maxW="100vw"
        maxH="100vh"
      >
        <ModalBody p={0}>
          <Flex
            minH="100vh"
            background="linear-gradient(135deg, #6246afff 0%, #7349e8ff 35%, #2563EA 100%)"
            alignItems="center"
            justifyContent="center"
            px={{ base: 4, md: 8 }}
          >
            <Box
              maxW={{ base: '100%', md: '500px' }}
              w="100%"
              bg={bgColor}
              p={{ base: 6, md: 10 }}
              borderRadius="20px"
              boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)"
              border={`1px solid ${borderColor}`}
            >
              {/* Logo */}
              <Flex justify="center" mb={6}>
                <Image
                  src={logo}
                  alt="Ideali Logo"
                  w={{ base: '140px', md: '180px' }}
                  h="auto"
                />
              </Flex>

              {/* Email Icon */}
             <Flex justify="center" mb={5}>
                <Flex
                  w="60px"
                  h="60px"
                  borderRadius="full"   // makes it perfectly round
                  bg="gray.200"          // your custom purple color
                  align="center"
                  justify="center"
                >
                  <MdOutlineEmail
                    size={28}
                    color="#2920DF"
                  />
                </Flex>
              </Flex>

              {/* Heading */}
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="bold"
                color={headingColor}
                textAlign="center"
                mb={2}
              >
                Two-Factor Authentication
              </Text>

              {/* Subtitle */}
              <Text
                fontSize="sm"
                color={subtitleColor}
                textAlign="center"
                mb={8}
              >
                Enter the authentication code we sent to your
                <br />
                email address.
              </Text>

              {/* OTP Input */}
              <Flex justify="center" mb={error ? 3 : 8}>
                <HStack spacing={{ base: 2, md: 3 }}>
                  <PinInput
                    otp
                    size="lg"
                    value={code}
                    onChange={handleCodeChange}
                    isDisabled={isVerifying}
                    onComplete={(val) => setCode(val)}
                  >
                    {[...Array(6)].map((_, i) => (
                      <PinInputField
                        key={i}
                        w={{ base: '46px', md: '54px' }}
                        h={{ base: '46px', md: '54px' }}
                        fontSize="xl"
                        fontWeight="600"
                        borderRadius="12px"
                        border="2px solid"
                        borderColor={error ? '#E53E3E' : code[i] ? '#5B4DC7' : borderColor}
                        color={error ? '#E53E3E' : headingColor}
                        _focus={{
                          borderColor: error ? '#E53E3E' : '#5B4DC7',
                          boxShadow: error ? '0 0 0 1px #E53E3E' : '0 0 0 1px #5B4DC7',
                        }}
                        _hover={{
                          borderColor: error ? '#E53E3E' : '#5B4DC7',
                        }}
                      />
                    ))}
                  </PinInput>
                </HStack>
              </Flex>

              {/* Error Message */}
              {error && (
                <Text
                  fontSize="sm"
                  color="#E53E3E"
                  textAlign="center"
                  mb={5}
                >
                  {error}
                </Text>
              )}

              {/* Verify Button */}
              <Button
                w="100%"
                h="50px"
                fontSize="md"
                fontWeight="600"
                borderRadius="14px"
                bg={code.length === 6 ? 'linear-gradient(135deg, #6246afff 0%, #2563EA 100%)' : 'gray.200'}
                color={code.length === 6 ? 'white' : 'gray.500'}
                onClick={handleVerify}
                isDisabled={code.length !== 6 || isVerifying}
                isLoading={isVerifying}
                loadingText="Verifying..."
                _hover={{
                  bg: code.length === 6 ? 'linear-gradient(135deg, #5236a0 0%, #1d53d4 100%)' : 'gray.200',
                }}
                _disabled={{
                  bg: 'gray.200',
                  color: 'gray.500',
                  cursor: 'not-allowed',
                }}
                mb={5}
              >
                Verify Code
              </Button>

              {/* Back to Sign In */}
              {onBackToSignIn && (
                <Flex justify="center">
                  <Button
                    variant="link"
                    fontSize="sm"
                    fontWeight="500"
                    color={subtitleColor}
                    onClick={onBackToSignIn}
                    leftIcon={<MdArrowBack size={16} />}
                    _hover={{ color: headingColor }}
                  >
                    Back to Sign In
                  </Button>
                </Flex>
              )}
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TwoFactorAuthModal;
