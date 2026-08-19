import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Flex,
  Button,
  Image,
  IconButton,
  Tooltip,
  VStack,
  HStack,
  Grid,
  Container,
  Progress,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { MdDarkMode, MdLightMode } from "react-icons/md";

interface PresetAmountType {
  enabled: boolean;
  amounts: { amount: number; description: string }[];
}

interface DesktopPreviewProps {
  name?: string;
  description?: string;
  fundRaisingGoal?: number;
  selectedColor?: string;
  startDate?: Date;
  endDate?: Date;
  bannerImage?: string | null;
  showFundraisingGoal?: boolean;
  presetAmounts?: {
    oneTime: PresetAmountType;
    monthly: PresetAmountType;
    yearly: PresetAmountType;
  };
}

const defaultPresetAmounts = {
  oneTime: {
    enabled: true,
    amounts: [
      { amount: 10, description: "Can help feeding 10 children" },
      { amount: 25, description: "Can help feeding 25 children" },
      { amount: 50, description: "Can help feeding 50 children" },
      { amount: 100, description: "Can help feeding 100 children" },
    ],
  },
  monthly: {
    enabled: false,
    amounts: [
      { amount: 15, description: "Can help feeding 30 children" },
      { amount: 30, description: "Can help feeding 60 children" },
      { amount: 75, description: "Can help feeding 150 children" },
      { amount: 150, description: "Can help feeding 300 children" },
    ],
  },
  yearly: {
    enabled: false,
    amounts: [
      { amount: 120, description: "Can help feeding 240 children" },
      { amount: 250, description: "Can help feeding 500 children" },
      { amount: 500, description: "Can help feeding 1000 children" },
      { amount: 1000, description: "Can help feeding 2000 children" },
    ],
  },
};

export default function DesktopPreview({
  name = "Help Children Get Clean Water",
  description = "Your donation will bring clean and safe drinking water to families in need.",
  fundRaisingGoal = 5000,
  selectedColor = "#F97316",
  startDate,
  endDate,
  bannerImage,
  showFundraisingGoal = true,
  presetAmounts = defaultPresetAmounts
}: DesktopPreviewProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDonationType, setSelectedDonationType] = useState<'oneTime' | 'monthly' | 'yearly'>('oneTime');

  // Get enabled donation types
  const enabledTypes = [
    presetAmounts.oneTime.enabled && 'oneTime',
    presetAmounts.monthly.enabled && 'monthly',
    presetAmounts.yearly.enabled && 'yearly',
  ].filter(Boolean) as ('oneTime' | 'monthly' | 'yearly')[];

  // Get current amounts based on selected type
  const currentAmounts = presetAmounts[selectedDonationType]?.amounts || [];

  // Labels for donation types
  const typeLabels: Record<string, string> = {
    oneTime: 'One Time',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };

  // Reset selected type if it becomes disabled
  useEffect(() => {
    if (enabledTypes.length > 0 && !enabledTypes.includes(selectedDonationType)) {
      setSelectedDonationType(enabledTypes[0]);
    }
  }, [enabledTypes, selectedDonationType]);

  const hasName =
    name && name.trim() !== "" && name !== "Help Children Get Clean Water";
  const hasDescription =
    description &&
    description.trim() !== "" &&
    description !==
      "Your donation will bring clean and safe drinking water to families in need.";
  const hasGoal = fundRaisingGoal && fundRaisingGoal > 0;

  const bgColor = isDarkMode ? "#1a1a1a" : "#ffffff";
  const bodyBg = isDarkMode ? "#111113" : "#f7fafc";
  const textColor = isDarkMode ? "white" : "gray.800";
  const subTextColor = isDarkMode ? "gray.400" : "gray.600";
  const cardBg = isDarkMode ? "gray.800" : "white";
  const cardBorder = isDarkMode ? "gray.700" : "gray.200";
  const navBorder = isDarkMode ? "gray.800" : "gray.100";

  return (
    <Flex w="100%" h="100%" bg="#f7fafc" align="center" justify="center" py={{ base: 4, md: 6 }}>
      <Box
        position="relative"
        w="100%"
        maxW="650px"
        sx={{
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))"
        }}
      >
        <Tooltip label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} placement="left">
          <IconButton
            aria-label="Toggle dark mode"
            icon={isDarkMode ? <MdLightMode /> : <MdDarkMode />}
            onClick={() => setIsDarkMode(!isDarkMode)}
            position="absolute"
            top="-12px"
            right="-12px"
            zIndex={50}
            size="sm"
            colorScheme={isDarkMode ? "yellow" : "purple"}
            borderRadius="full"
            boxShadow="lg"
          />
        </Tooltip>

        <Box
          bg="gray.900"
          borderRadius="16px"
          p={{ base: 1.5, md: 2 }}
          border="1px solid"
          borderColor="gray.800"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(to-b, rgba(255,255,255,0.06), rgba(0,0,0,0))"
            pointerEvents="none"
          />

          <HStack
            position="absolute"
            top="19px"
            left="50%"
            transform="translateX(-50%)"
            spacing="4px"
            zIndex={20}
          >
            <Box w="32px" h="4px" borderRadius="full" bg="blackAlpha.700" border="1px solid" borderColor="blackAlpha.600" />
            <Box w="6px" h="6px" borderRadius="full" bg="black" border="1px solid" borderColor="whiteAlpha.300"
              boxShadow="inset 0 0 0 2px rgba(0,0,0,0.6)"/>
            <Box w="4px" h="4px" borderRadius="full" bg="black" border="1px solid" borderColor="whiteAlpha.300" />
          </HStack>

          <Box
            bg={bodyBg}
            borderRadius="12px"
            overflow="hidden"
            border="1px solid"
            borderColor={isDarkMode ? "gray.700" : "gray.300"}
            h={{ base: "40vh", md: "45vh", lg: "48vh" }}
          >
            {/* Browser Top Bar */}
            <Flex
              h="28px"
              bg={isDarkMode ? "gray.900" : "gray.100"}
              borderBottom="1px solid"
              borderColor={navBorder}
              alignItems="center"
              px={2}
              gap={2}
            >
              <HStack spacing={1}>
                <Box w="8px" h="8px" borderRadius="full" bg="#FF5F56" />
                <Box w="8px" h="8px" borderRadius="full" bg="#FFBD2E" />
                <Box w="8px" h="8px" borderRadius="full" bg="#27C93F" />
              </HStack>
              <Box
                flex="1"
                mx={2}
                px={2}
                py={0.5}
                bg={isDarkMode ? "gray.800" : "white"}
                borderRadius="md"
                fontSize="2xs"
                color={subTextColor}
                border="1px solid"
                borderColor={cardBorder}
              >
                https://donate-campaign
              </Box>
            </Flex>

            <Box
              h="calc(100% - 28px)"
              overflowY="auto"
              bg={bodyBg}
              sx={{
                "::-webkit-scrollbar": { width: "6px" },
                "::-webkit-scrollbar-track": { bg: isDarkMode ? "gray.900" : "gray.100" },
                "::-webkit-scrollbar-thumb": { bg: isDarkMode ? "gray.600" : "gray.400", borderRadius: "full" },
              }}
            >
              

              <Box position="relative" h="280px" overflow="hidden" bg="gray.900">
                <Image
                  src={bannerImage || "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1920&q=80"}
                  alt="Campaign cover"
                  objectFit="cover"
                  w="100%"
                  h="100%"
                  draggable={false}
                />
                <Box
                  position="absolute"
                  inset={0}
                  bg={`linear-gradient(135deg, ${selectedColor}40, rgba(0,0,0,0.7))`}
                />
                <Container
                  maxW="1200px"
                  position="absolute"
                  bottom="0"
                  left="50%"
                  transform="translateX(-50%)"
                  pb={10}
                >
                  <Box
                    opacity={hasName ? 1 : 0.4}
                    filter={hasName ? "none" : "blur(2px)"}
                    transition="all 0.3s ease"
                  >
                    <Text
                      fontSize="5xl"
                      fontWeight="black"
                      color="white"
                      mb={3}
                      lineHeight="1.1"
                      textShadow="0 2px 10px rgba(0,0,0,0.5)"
                    >
                      {name}
                    </Text>
                    <Text
                      fontSize="lg"
                      color="whiteAlpha.900"
                      fontWeight="medium"
                      textShadow="0 1px 3px rgba(0,0,0,0.5)"
                    >
                      Together we can make a difference ❤️
                    </Text>
                  </Box>
                </Container>
              </Box>

              {/* Main Content Section */}
              <Container maxW="1200px" py={8}>
                <Grid templateColumns={{ base: "1fr", md: "1.5fr 1fr" }} gap={6}>
                  {/* Left Column - Campaign Details */}
                  <VStack spacing={6} align="stretch">
                    {/* Goal Section */}
                    {showFundraisingGoal && (
                      <Box
                        p={6}
                        borderRadius="xl"
                        bg={cardBg}
                        borderWidth="2px"
                        borderColor={selectedColor}
                        boxShadow="lg"
                        opacity={hasGoal ? 1 : 0.4}
                        filter={hasGoal ? "none" : "blur(2px)"}
                        transition="all 0.3s ease"
                      >
                        <Box textAlign="left" mb={4}>
                          <Text
                            fontSize="xs"
                            color={selectedColor}
                            fontWeight="semibold"
                            textTransform="uppercase"
                            letterSpacing="wider"
                            mb={3}
                          >
                            🎯 Fundraising Goal
                          </Text>
                          <Text fontSize="4xl" fontWeight="black" color={selectedColor} lineHeight="1">
                            ${fundRaisingGoal.toLocaleString()}
                          </Text>
                        </Box>
                        <Box mt={3} w="100%">
                            <Progress
                              value={40}
                              size="sm"
                              w="100%"                    // ✅ force full width
                              borderRadius="full"
                              bg={isDarkMode ? "gray.700" : "gray.200"}
                              sx={{
                                "& > div": {
                                  backgroundColor: selectedColor,
                                },
                              }}
                            />
                          </Box>

                        {/* {startDate && endDate && (
                          <Flex
                            justify="center"
                            gap={8}
                            pt={4}
                            borderTopWidth="1px"
                            borderColor={cardBorder}
                          >
                            <Box textAlign="center">
                              <Text fontSize="xs" color={subTextColor} fontWeight="semibold" textTransform="uppercase" mb={2}>
                                Campaign Starts
                              </Text>
                              <Text fontSize="md" color={textColor} fontWeight="bold">
                                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Text>
                            </Box>
                            <Box textAlign="center">
                              <Text fontSize="xs" color={subTextColor} fontWeight="semibold" textTransform="uppercase" mb={2}>
                                Campaign Ends
                              </Text>
                              <Text fontSize="md" color={textColor} fontWeight="bold">
                                {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Text>
                            </Box>
                          </Flex>
                        )} */}
                      </Box>
                    )}

                    {/* Description Section */}
                    <Box
                      p={5}
                      borderRadius="xl"
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={cardBorder}
                      boxShadow="lg"
                      opacity={hasDescription ? 1 : 0.4}
                      filter={hasDescription ? "none" : "blur(2px)"}
                      transition="all 0.3s ease"
                    >
                      <Text fontSize="lg" fontWeight="bold" color={textColor} mb={3}>
                        About this campaign
                      </Text>
                      <Box
                        fontSize="xs"
                        color={subTextColor}
                        lineHeight="1.6"
                        fontWeight="normal"
                        overflowWrap="break-word"
                        wordBreak="break-word"
                        overflow="hidden"
                        sx={{
                          // Override all inline width styles from Summernote/jQuery
                          '& *': {
                            maxWidth: '100% !important',
                            width: 'auto !important',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            color: `${subTextColor} !important`,
                          },
                          '& p': {
                            marginBottom: '0.5rem',
                            maxWidth: '100% !important',
                            width: 'auto !important',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            color: `${subTextColor} !important`,
                          },
                          '& div': {
                            maxWidth: '100% !important',
                            width: 'auto !important',
                            color: `${subTextColor} !important`,
                          },
                          '& ul, & ol': {
                            marginLeft: '1.5rem',
                            marginBottom: '0.5rem',
                            maxWidth: '100% !important',
                            color: `${subTextColor} !important`,
                          },
                          '& li': {
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            color: `${subTextColor} !important`,
                          },
                          '& a': {
                            color: 'blue.500 !important',
                            textDecoration: 'underline',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          },
                          '& img': {
                            maxWidth: '100%',
                            height: 'auto',
                          },
                          '& b': {
                            fontWeight: 'bold',
                            color: `${subTextColor} !important`,
                          },
                          '& u': {
                            textDecoration: 'underline',
                            color: `${subTextColor} !important`,
                          },
                          '& i': {
                            fontStyle: 'italic',
                            color: `${subTextColor} !important`,
                          },
                          '& span': {
                            color: `${subTextColor} !important`,
                          },
                          '& h1': {
                            fontSize: '1.75rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            color: `${textColor} !important`,
                          },
                          '& h2': {
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            color: `${textColor} !important`,
                          },
                          '& h3': {
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            color: `${textColor} !important`,
                          },
                          '& h4': {
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            color: `${textColor} !important`,
                          },
                          '& h5': {
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            color: `${textColor} !important`,
                          },
                          '& h6': {
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                            color: `${textColor} !important`,
                          },
                          '& blockquote': {
                            borderLeft: '3px solid',
                            borderColor: selectedColor,
                            paddingLeft: '1rem',
                            marginY: '0.5rem',
                            fontStyle: 'italic',
                            color: `${subTextColor} !important`,
                          },
                          '& pre': {
                            backgroundColor: isDarkMode ? 'gray.800' : 'gray.100',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            overflowX: 'auto',
                            marginY: '0.5rem',
                          },
                          '& code': {
                            backgroundColor: isDarkMode ? 'gray.800' : 'gray.100',
                            padding: '0.125rem 0.25rem',
                            borderRadius: '2px',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                          },
                        }}
                        dangerouslySetInnerHTML={{ __html: description || '' }}
                      />
                    </Box>
                  </VStack>

                  {/* Right Column - Donation Card */}
                  <Box>
                    <Box
                      p={5}
                      borderRadius="xl"
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={cardBorder}
                      boxShadow="xl"
                      position="sticky"
                      top="70px"
                    >
                      <Text fontSize="md" fontWeight="bold" color={textColor} mb={3}>
                        Choose Your Donation
                      </Text>

                      {/* Donation Type Pills - Only show if at least one type is enabled */}
                      {enabledTypes.length > 0 && (
                        <HStack spacing={2} mb={4} flexWrap="wrap">
                          {enabledTypes.map((type) => (
                            <Box
                              key={type}
                              as="button"
                              px={4}
                              py={1.5}
                              borderRadius="full"
                              bg={selectedDonationType === type ? selectedColor : "transparent"}
                              color={selectedDonationType === type ? "white" : subTextColor}
                              fontSize="xs"
                              fontWeight="semibold"
                              borderWidth="1px"
                              borderColor={selectedDonationType === type ? selectedColor : cardBorder}
                              cursor="pointer"
                              transition="all 0.2s ease"
                              _hover={{
                                bg: selectedDonationType === type ? selectedColor : isDarkMode ? "gray.700" : "gray.100",
                              }}
                              onClick={() => setSelectedDonationType(type)}
                            >
                              {typeLabels[type]}
                            </Box>
                          ))}
                        </HStack>
                      )}

                      {/* 2x2 Grid of Donation Amounts - Only show if at least one type is enabled */}
                      {enabledTypes.length > 0 && currentAmounts.length > 0 && (
                        <Grid templateColumns="repeat(2, 1fr)" gap={3} mb={4}>
                          {currentAmounts.slice(0, 4).map((item, index) => (
                            <Box
                              key={index}
                              p={3}
                              borderRadius="lg"
                              borderWidth="1px"
                              borderColor={cardBorder}
                              bg={cardBg}
                              textAlign="center"
                              cursor="pointer"
                              transition="all 0.2s ease"
                              _hover={{
                                borderColor: selectedColor,
                                transform: "translateY(-1px)",
                                boxShadow: "md"
                              }}
                            >
                              <Text fontSize="xl" fontWeight="bold" color={selectedColor} mb={1}>
                                ${item.amount}
                              </Text>
                              <Text fontSize="2xs" color={subTextColor} lineHeight="1.3">
                                {item.description}
                              </Text>
                            </Box>
                          ))}
                        </Grid>
                      )}

                      {/* Custom Amount Section */}
                      <Text fontSize="xs" color={subTextColor} mb={2}>
                        {enabledTypes.length > 0 ? "Or enter a custom amount" : "Enter donation amount"}
                      </Text>
                      <InputGroup mb={4}>
                        <InputLeftElement
                          pointerEvents="none"
                          h="100%"
                          pl={3}
                        >
                          <Text color={subTextColor} fontSize="sm">$</Text>
                        </InputLeftElement>
                        <Input
                          placeholder="Enter amount"
                          size="md"
                          borderRadius="lg"
                          borderColor={cardBorder}
                          bg={cardBg}
                          color={textColor}
                          pl={8}
                          _placeholder={{ color: subTextColor }}
                          _hover={{ borderColor: selectedColor }}
                          _focus={{ borderColor: selectedColor, boxShadow: `0 0 0 1px ${selectedColor}` }}
                        />
                      </InputGroup>

                      {/* Continue to Payment Button */}
                      <Button
                        w="100%"
                        h="50px"
                        borderRadius="xl"
                        fontSize="md"
                        fontWeight="semibold"
                        bg={selectedColor}
                        color="white"
                        boxShadow="0 4px 14px -4px rgba(0, 0, 0, 0.3)"
                        _hover={{
                          filter: "brightness(0.9)",
                          transform: "translateY(-1px)",
                          boxShadow: "0 6px 20px -4px rgba(0, 0, 0, 0.4)"
                        }}
                        _active={{
                          transform: "translateY(0)",
                          boxShadow: "0 2px 8px -4px rgba(0, 0, 0, 0.3)"
                        }}
                        transition="all 0.2s ease"
                      >
                        Continue to Payment →
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Container>

              {/* Footer */}
              <Box
                bg={bgColor}
                borderTop="1px solid"
                borderColor={navBorder}
                py={5}
                mt={8}
              >
                <Container maxW="1200px">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color={subTextColor}>
                      © 2025 CharityOrg. All rights reserved.
                    </Text>
                    <HStack spacing={4}>
                      <Text fontSize="xs" color={subTextColor} cursor="pointer" _hover={{ color: textColor }}>
                        Privacy
                      </Text>
                      <Text fontSize="xs" color={subTextColor} cursor="pointer" _hover={{ color: textColor }}>
                        Terms
                      </Text>
                      <Text fontSize="xs" color={subTextColor} cursor="pointer" _hover={{ color: textColor }}>
                        Contact
                      </Text>
                    </HStack>
                  </Flex>
                </Container>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* HINGE - changes with dark mode */}
        <Box
          h="10px"
          mt="4px"
          mx="auto"
          w="70%"
          borderRadius="6px"
          bgGradient={isDarkMode
            ? "linear(to-b, gray.700, gray.900)"
            : "linear(to-b, gray.300, gray.500)"}
          border="1px solid"
          borderColor={isDarkMode ? "gray.700" : "gray.400"}
        />

        {/* BASE / KEYBOARD - changes with dark mode */}
        <Box
          mt="6px"
          borderRadius="14px"
          bgGradient={isDarkMode
            ? "linear(to-b, #2b2b2b, #1c1c1c)"
            : "linear(to-b, #f5f5f7, #dcdde1)"}
          border="1px solid"
          borderColor={isDarkMode ? "gray.700" : "gray.300"}
          px={{ base: 3, md: 5 }}
          pt={{ base: 3, md: 5 }}
          pb={{ base: 4, md: 6 }}
          position="relative"
        >
          {/* Keyboard keys (stylized grid) */}
          <Grid
            templateColumns="repeat(12, 1fr)"
            gap={1}
            mb={{ base: 3, md: 4 }}
          >
            {Array.from({ length: 12 * 3 }).map((_, i) => (
              <Box
                key={i}
                h={{ base: "14px", md: "16px" }}
                borderRadius="4px"
                bg={isDarkMode ? "gray.700" : "white"}
                border="1px solid"
                borderColor={isDarkMode ? "gray.600" : "gray.300"}
              />
            ))}
          </Grid>

          {/* Space bar row */}
          <HStack spacing={1.5} mb={{ base: 2, md: 3 }} justify="center">
            <Box w="16%" h={{ base: "14px", md: "16px" }} borderRadius="4px" bg={isDarkMode ? "gray.700" : "white"} border="1px solid" borderColor={isDarkMode ? "gray.600" : "gray.300"} />
            <Box w="40%" h={{ base: "14px", md: "16px" }} borderRadius="6px" bg={isDarkMode ? "gray.700" : "white"} border="1px solid" borderColor={isDarkMode ? "gray.600" : "gray.300"} />
            <Box w="16%" h={{ base: "14px", md: "16px" }} borderRadius="4px" bg={isDarkMode ? "gray.700" : "white"} border="1px solid" borderColor={isDarkMode ? "gray.600" : "gray.300"} />
          </HStack>

          {/* Trackpad */}
          <Box
            mx="auto"
            w={{ base: "45%", md: "32%" }}
            h={{ base: "35px", md: "45px" }}
            borderRadius="10px"
            bg={isDarkMode ? "gray.800" : "white"}
            border="1px solid"
            borderColor={isDarkMode ? "gray.600" : "gray.300"}
            boxShadow={isDarkMode ? "inset 0 2px 4px rgba(0,0,0,0.35)" : "inset 0 2px 4px rgba(0,0,0,0.1)"}
          />
        </Box>

        {/* Base shadow */}
        <Box
          mt="6px"
          h="6px"
          w="75%"
          mx="auto"
          borderRadius="full"
          bgGradient="radial(gray.900, transparent)"
          opacity={0.2}
        />
      </Box>
    </Flex>
  );
}
