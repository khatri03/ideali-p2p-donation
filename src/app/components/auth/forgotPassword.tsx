import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Image,
  useColorModeValue,
  useToast,Flex
} from "@chakra-ui/react";

import logo from "../../../assets/img/logo/idealiLogo.svg";
import CommonMethod from "app/service/helpers/commonMethod";
import forgetPasswordService from '../../service/auth/forgetPassword';
function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromSignIn = location.state?.email;
  const [email, setEmail] = useState(emailFromSignIn || "");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const textColorBrand = useColorModeValue('#4318FF', '#FFFFFF');
  
  // ✅ All useColorModeValue hooks at top
  const textColor = useColorModeValue("#1B2559", "#FFFFFF");
  const textColorSecondary = "#A3AED0";
  const bgColor = useColorModeValue("#FFFFFF", "#1B254B");
  const borderColor = useColorModeValue("#E0E5F2", "#2D3748");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const buttonBg = useColorModeValue("#044bd9", "#044bd9");
  const buttonHoverBg = useColorModeValue("#044bd9", "#044bd9");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !isCodeSent) {
      e.preventDefault();
      handleSendCode();
    }
  };

  const handleSendCode = () => {
    (async () => {
      if (!email) {
        toast({
          title: "Validation Error",
          description: "Please enter your email address",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: 'top-right'
        });
        return;
      }
      if (!CommonMethod.EmailValidation(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        return;
      }

      try {
        setIsLoading(true);
        const response = await forgetPasswordService.sendForgotPasswordEmail(email);

        if (response.success) {
          setIsCodeSent(true);
          const sentEmail = email;
          setEmail('');
          toast({
            title: "Email Sent",
            description: response.message || `Reset password link sent successfully to ${sentEmail}. Check your email inbox please!`,
            status: "success",
            duration: 4000,
            isClosable: true,
            position: 'top-right'
          });
        } else {
          toast({
            title: "Error",
            description: response.message || 'Unable to send reset link',
            status: 'error',
            duration: 3000,
            isClosable: true,
            position: 'top-right'
          });
        }
      } catch (err: any) {
        console.error('Forgot password error', err);
        const message = err?.response?.data?.message || err?.message || 'An error occurred while sending reset link';
        toast({
          title: "Failed",
          description: message,
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'top-right'
        });
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <Box
      minH="100vh"
      background="linear-gradient(135deg, #6246afff 0%, #7349e8ff 35%, #2563EA 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={{ base: 4, md: 8 }}
    >
      <Box
        maxW={{ base: "100%", md: "500px" }}
        w="100%"
        bg={bgColor}
        p={{ base: 6, md: 8 }}
        borderRadius="20px"
        boxShadow="0px 18px 40px rgba(112, 144, 176, 0.12)"
        border={`1px solid ${borderColor}`}
      >
        <VStack spacing={6} align="stretch">
          {/* Logo and title */}
          <Box textAlign="center">
            <Image
              src={logo}
              alt="Ideali Logo"
              w={{ base: "160px", md: "250px" }}
              h="auto"
              display="block"
              mx="auto"
              mb="8px"
            />            {/* <Text color={textColor} fontSize="lg" fontWeight="bold" mb="2">
            Forgot Password
            </Text> */}
            <Text color={textColorSecondary} fontSize="md">
              Enter your email and we’ll send you a reset link
            </Text>
          </Box>

          {/* Email Field */}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="500" color={textColor}>
              Email
            </FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="mail@example.com"
              fontSize="sm"
              fontWeight="500"
              h="50px"
              borderRadius="16px"
              border="1px solid"
              borderColor={borderColor}
            />
          </FormControl>
     <Flex justify="space-between" align="center">
              <Text
                color={textColorBrand}
                fontSize="sm"
                fontWeight="500"
                cursor="pointer"
                _hover={{
                  textDecoration: 'underline'
                }
              
              }
              onClick={() => navigate("/auth/sign-in/custom")}
              >
               Back To Login Page
              </Text>
            </Flex>

          {/* Send Code Button */}
          <Button
            onClick={handleSendCode}
            h="50px"
            fontSize="sm"
            fontWeight="500"
            borderRadius="16px"
            bg={buttonBg}
            color="white"
            _hover={{ bg: buttonHoverBg }}
            disabled={isLoading || isCodeSent}
          >
            {isLoading ? 'Sending...' : 'Reset Password'}
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}

export default ForgotPassword;
