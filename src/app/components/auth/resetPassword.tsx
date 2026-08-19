
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
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
	useToast,
	Flex,
	InputGroup,
	InputRightElement,
	IconButton,
	Spinner,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

import logo from "../../../assets/img/logo/idealiLogo.svg";
import forgetPasswordService from '../../service/auth/forgetPassword';
import CommonMethod from 'app/service/helpers/commonMethod';

function ResetPassword() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const resetToken = searchParams.get('resetToken');

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isVerifyingToken, setIsVerifyingToken] = useState(true);
	const [isTokenValid, setIsTokenValid] = useState(false);
	const toast = useToast();

	const textColorBrand = useColorModeValue('#4318FF', '#FFFFFF');
	const textColor = useColorModeValue("#1B2559", "#FFFFFF");
	const textColorSecondary = "#A3AED0";
	const bgColor = useColorModeValue("#FFFFFF", "#1B254B");
	const borderColor = useColorModeValue("#E0E5F2", "#2D3748");
	const buttonBg = useColorModeValue("#044bd9", "#044bd9");
	const buttonHoverBg = useColorModeValue("#033fb6", "#033fb6");

	useEffect(() => {
		// Verify reset token
		const verifyToken = async () => {
			if (!resetToken) {
				toast({
					title: "Invalid Link",
					description: "Reset token is missing. Please use the link from your email.",
					status: "error",
					duration: 5000,
					isClosable: true,
					position: 'top-right'
				});
				setIsVerifyingToken(false);
				setIsTokenValid(false);
				// Redirect to forgot password page
				setTimeout(() => {
					navigate('/account/forgot-password');
				}, 3000);
				return;
			}

			try {
				setIsVerifyingToken(true);
				const response = await forgetPasswordService.verifyResetToken(resetToken);

				if (response.success && response.data === "true") {
					setIsTokenValid(true);
				} else {
					setIsTokenValid(false);
					toast({
						title: "Invalid Token",
						description: "This reset link is invalid or has expired. Please request a new one.",
						status: "error",
						duration: 5000,
						isClosable: true,
						position: 'top-right'
					});
					setTimeout(() => {
						navigate('/account/forgot-password');
					}, 3000);
				}
			} catch (error: any) {
				console.error("Token verification error:", error);
				setIsTokenValid(false);
				toast({
					title: "Verification Failed",
					description: "Unable to verify reset link. Please request a new one.",
					status: "error",
					duration: 5000,
					isClosable: true,
					position: 'top-right'
				});
				setTimeout(() => {
					navigate('/account/forgot-password');
				}, 3000);
			} finally {
				setIsVerifyingToken(false);
			}
		};

		verifyToken();
	}, [resetToken, navigate, toast]);

	const handleResetPassword = async () => {
		if (!newPassword || !confirmPassword) {
			toast({
				title: "Validation Error",
				description: "Please enter both password fields",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: 'top-right'
			});
			return;
		}

		if (!CommonMethod.PasswordValidation(newPassword)) {
			toast({
				title: "Weak Password",
				description: "Password must be 8-20 chars with a number and special character",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: 'top-right'
			});
			return;
		}

		if (newPassword !== confirmPassword) {
			toast({
				title: "Mismatch",
				description: "New password and Confirm password do not match",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: 'top-right'
			});
			return;
		}

		setIsLoading(true);

		try {
			const response = await forgetPasswordService.resetPassword(
				resetToken!,
				newPassword,
				confirmPassword
			);

			if (response.success) {
				toast({
					title: "Password Reset",
					description: response.message || "Your password has been successfully reset. Redirecting to login...",
					status: "success",
					duration: 3000,
					isClosable: true,
					position: 'top-right'
				});

				// Redirect to login page after 2 seconds
				setTimeout(() => {
					navigate('/auth/sign-in/custom');
				}, 2000);
			} else {
				toast({
					title: "Error",
					description: response.message || "Failed to reset password. Please try again.",
					status: "error",
					duration: 5000,
					isClosable: true,
					position: 'top-right'
				});
			}
		} catch (error: any) {
			console.error("Reset password error:", error);

			const errorMessage = error.response?.data?.message ||
								error.message ||
								"An error occurred. Please try again or request a new reset link.";

			toast({
				title: "Reset Failed",
				description: errorMessage,
				status: "error",
				duration: 5000,
				isClosable: true,
				position: 'top-right'
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Show loading while verifying token
	if (isVerifyingToken) {
		return (
			<Box
				minH="100vh"
				background="linear-gradient(135deg, #6246afff 0%, #7349e8ff 35%, #2563EA 100%)"
				display="flex"
				alignItems="center"
				justifyContent="center"
				px={{ base: 4, md: 8 }}
			>
				<VStack spacing={4}>
					<Spinner size="xl" color="white" thickness="4px" />
					<Text color="white" fontSize="lg">Verifying reset link...</Text>
				</VStack>
			</Box>
		);
	}

	// Don't show form if token is invalid
	if (!isTokenValid) {
		return null;
	}

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
					<Box textAlign="center">
						<Image
							src={logo}
							alt="Ideali Logo"
							w={{ base: "160px", md: "250px" }}
							h="auto"
							display="block"
							mx="auto"
							mb="8px"
						/>
						<Text color={textColorSecondary} fontSize="md">
							Enter your new password below
						</Text>
					</Box>

					<FormControl>
						<FormLabel fontSize="sm" fontWeight="500" color={textColor}>
							New Password
						</FormLabel>
						<InputGroup>
							<Input
								type={showNewPassword ? "text" : "password"}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="Enter new password"
								fontSize="sm"
								fontWeight="500"
								h="50px"
								borderRadius="16px"
								border="1px solid"
								borderColor={borderColor}
							/>
							<InputRightElement h="50px">
								<IconButton
									aria-label={showNewPassword ? "Hide password" : "Show password"}
									icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
									onClick={() => setShowNewPassword(!showNewPassword)}
									variant="ghost"
									size="sm"
								/>
							</InputRightElement>
						</InputGroup>
						<Text fontSize="xs" color={textColorSecondary} mt={1}>
							Password must be 8-20 chars with a number and special character
						</Text>
					</FormControl>

					<FormControl>
						<FormLabel fontSize="sm" fontWeight="500" color={textColor}>
							Confirm Password
						</FormLabel>
						<InputGroup>
							<Input
								type={showConfirmPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm new password"
								fontSize="sm"
								fontWeight="500"
								h="50px"
								borderRadius="16px"
								border="1px solid"
								borderColor={borderColor}
							/>
							<InputRightElement h="50px">
								<IconButton
									aria-label={showConfirmPassword ? "Hide password" : "Show password"}
									icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									variant="ghost"
									size="sm"
								/>
							</InputRightElement>
						</InputGroup>
					</FormControl>

					<Flex justify="space-between" align="center">
						<Text
							color={textColorBrand}
							fontSize="sm"
							fontWeight="500"
							cursor="pointer"
							_hover={{ textDecoration: 'underline' }}
							onClick={() => navigate("/auth/sign-in/custom")}
						>
							Back To Login Page
						</Text>
					</Flex>

					<Button
						onClick={handleResetPassword}
						h="50px"
						fontSize="sm"
						fontWeight="500"
						borderRadius="16px"
						bg={buttonBg}
						color="white"
						_hover={{ bg: buttonHoverBg }}
						isLoading={isLoading}
						loadingText="Resetting..."
					>
						Reset Password
					</Button>
				</VStack>
			</Box>
		</Box>
	);
}

export default ResetPassword;

