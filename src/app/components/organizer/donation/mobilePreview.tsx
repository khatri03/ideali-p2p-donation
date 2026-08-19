import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Flex,
  Button,
  Image,
  IconButton,
  Tooltip,
  HStack,
  Grid,
  Input,
  InputGroup,
  InputLeftElement,
   Progress, 

} from "@chakra-ui/react";
import { MdDarkMode, MdLightMode } from "react-icons/md";

interface PresetAmountType {
  enabled: boolean;
  amounts: { amount: number; description: string }[];
}

interface MobilePreviewProps {
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

export default function MobilePreview({
  name = "Help Children Get Clean Water",
  description = "Your donation will bring clean and safe drinking water to families in need.",
  fundRaisingGoal = 5000,
  selectedColor = "#F97316",
  startDate,
  endDate,
  bannerImage,
  showFundraisingGoal = true,
  presetAmounts = defaultPresetAmounts
}: MobilePreviewProps) {
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

  const bgColor = isDarkMode
    ? "linear-gradient(180deg, #1a1a1a, #111113)"
    : "linear-gradient(180deg, #f5f5f5, #e0e0e0)";
  const borderColor = isDarkMode ? "gray.700" : "gray.900";
  const textColor = isDarkMode ? "white" : "gray.800";
  const subTextColor = isDarkMode ? "gray.300" : "gray.600";
  const cardBg = isDarkMode ? "gray.900" : "white";
  const cardBorder = isDarkMode ? "gray.700" : "gray.200";

  return (
    <Box position="relative">
      <Tooltip
        label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        placement="left"
      >
        <IconButton
          aria-label="Toggle dark mode"
          icon={isDarkMode ? <MdLightMode /> : <MdDarkMode />}
          onClick={() => setIsDarkMode(!isDarkMode)}
          position="absolute"
          top="-10px"
          right="-10px"
          zIndex={20}
          size="sm"
          colorScheme={isDarkMode ? "yellow" : "purple"}
          borderRadius="full"
          boxShadow="lg"
        />
      </Tooltip>

      <Box
        position="relative"
        w="300px"
        h="580px"
        borderRadius="50px"
        bg="grey"
        p="4px"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box
          position="relative"
          w="100%"
          h="100%"
          bg={bgColor}
          borderRadius="46px"
          overflow="hidden"
          borderWidth="3px"
          borderColor={borderColor}
          boxShadow="inset 0 0 20px rgba(0,0,0,0.4)"
        >
          <Box
            position="absolute"
            top="6px"
            left="50%"
            transform="translateX(-50%)"
            w="90px"
            h="22px"
            bg="black"
            borderRadius="full"
            zIndex={10}
          />

          <Box
            position="absolute"
            top="0"
            bottom="0"
            left="0"
            right="0"
            overflowY="auto"
            pb={4}
            sx={{ "::-webkit-scrollbar": { display: "none" } }}
          >
            <Box position="relative" h="150px" overflow="hidden" bg="gray.900" >
              <Image
                src={bannerImage || "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1000&q=80"}
                alt="Campaign cover"
                objectFit="cover"
                w="100%"
                h="100%"
                draggable={false}
              />
              <Box
                position="absolute"
                inset={0}
                bg={`linear-gradient(180deg, ${selectedColor}10, rgba(0,0,0,0.55))`}
              />
              <Box
                position="absolute"
                left={10}
                right={10}
                bottom={12}
                px={3}
                py={2}
                borderRadius="lg"
                bg={isDarkMode ? "blackAlpha.600" : "whiteAlpha.800"}
                backdropFilter="saturate(160%) blur(10px)"
                boxShadow="0 8px 24px rgba(0,0,0,0.25)"
                opacity={hasName ? 1 : 0.4}
                filter={hasName ? "none" : "blur(2px)"}
                transition="all 0.3s ease"
                textAlign="center"
              >
                <Text
                  fontSize="md"
                  fontWeight="extrabold"
                  color={textColor}
                  noOfLines={2}
                  lineHeight="1.3"
                >
                  {name}
                </Text>
                <Text
                  fontSize="2xs"
                  mt={1}
                  color={subTextColor}
                  noOfLines={1}
                  fontWeight="medium"
                >
                  Together we can make a difference ❤️
                </Text>
              </Box>
            </Box>

                                  <Box px={3} py={3}>
                            {showFundraisingGoal && (
                              <Box
                                mt={1}
                                p={4}
                                borderRadius="2xl"
                                bg={cardBg}
                                borderWidth="2px"
                                borderColor={selectedColor}
                                boxShadow="md"
                                opacity={hasGoal ? 1 : 0.4}
                                filter={hasGoal ? "none" : "blur(2px)"}
                                transition="all 0.3s ease"
                              >
                                <Box textAlign="left" mb={3}>
                                  <Text
                                    fontSize="2xs"
                                    color={selectedColor}
                                    fontWeight="semibold"
                                    textTransform="uppercase"
                                    letterSpacing="wide"
                                    mb={2}
                                  >
                                    🎯 Fundraising Goal
                                  </Text>

                                  <Text
                                    fontSize="2xl"
                                    fontWeight="black"
                                    color={selectedColor}
                                    lineHeight="1"
                                  >
                                    {fundRaisingGoal.toLocaleString()}
                                  </Text>
                                    <Box mt={3}>
                                    <Progress
                                        w="100%"                    // ✅ force full width

                                      value={40}
                                      size="sm"
                                      borderRadius="full"
                                      bg={isDarkMode ? "gray.700" : "gray.200"}
                                      sx={{
                                        "& > div": {
                                          backgroundColor: selectedColor,
                                        },
                                      }}
                                    />
                                  </Box>

                                
                                </Box>
     

      {/* {startDate && endDate && (
        <Flex
          justify="center"
          gap={4}
          pt={3}
          borderTopWidth="1px"
          borderColor={cardBorder}
          flexWrap="wrap"
        >
          <Box textAlign="center">
            <Text
              fontSize="2xs"
              color={subTextColor}
              fontWeight="semibold"
              textTransform="uppercase"
              mb={1}
            >
              Starts
            </Text>
            <Text fontSize="xs" color={textColor} fontWeight="bold">
              {new Date(startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Box>

          <Box textAlign="center">
            <Text
              fontSize="2xs"
              color={subTextColor}
              fontWeight="semibold"
              textTransform="uppercase"
              mb={1}
            >
              Ends
            </Text>
            <Text fontSize="xs" color={textColor} fontWeight="bold">
              {new Date(endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Box>
        </Flex>
      )} */}

      
    </Box>
    
  )}

            {/* About This Cause Card Box */}
            <Box
              mt={3}
              p={4}
              borderRadius="xl"
              bg={cardBg}
              // minH="260px"
              boxShadow="md"
            >
              <Text fontSize="lg" fontWeight="bold" color={textColor} mb={2}>
                About This Cause
              </Text>
              <Box
                fontSize="xs"
                color={subTextColor}
                lineHeight="1.25"
                fontWeight="medium"
                overflowWrap="break-word"
                wordBreak="break-word"
                overflow="hidden"
                sx={{
                  '& p': { marginBottom: '0.5rem', overflowWrap: 'break-word', wordBreak: 'break-word', color: `${subTextColor} !important` },
                  '& ul, & ol': { marginLeft: '1.5rem', marginBottom: '0.5rem', color: `${subTextColor} !important` },
                  '& li': { overflowWrap: 'break-word', wordBreak: 'break-word', color: `${subTextColor} !important` },
                  '& a': { color: 'blue.500 !important', textDecoration: 'underline', overflowWrap: 'break-word', wordBreak: 'break-word' },
                  '& img': { maxWidth: '100%', height: 'auto' },
                  '& *': { maxWidth: '100%', color: `${subTextColor} !important` },
                  '& span': { color: `${subTextColor} !important` },
                  '& h1': { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: `${textColor} !important` },
                  '& h2': { fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: `${textColor} !important` },
                  '& h3': { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: `${textColor} !important` },
                  '& h4': { fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: `${textColor} !important` },
                  '& h5': { fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: `${textColor} !important` },
                  '& h6': { fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', color: `${textColor} !important` },
                  '& blockquote': { borderLeft: '3px solid', borderColor: selectedColor, paddingLeft: '0.75rem', marginY: '0.5rem', fontStyle: 'italic', color: `${subTextColor} !important` },
                  '& pre': { backgroundColor: isDarkMode ? 'gray.800' : 'gray.100', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', marginY: '0.5rem' },
                  '& code': { backgroundColor: isDarkMode ? 'gray.800' : 'gray.100', padding: '0.125rem 0.25rem', borderRadius: '2px', fontFamily: 'monospace', fontSize: '0.75rem' },
                }}
                dangerouslySetInnerHTML={{ __html: description || '' }}
              />
            </Box>

            {/* Donation Card Box */}
            <Box
              mt={4}
              p={4}
              borderRadius="xl"
              bg={cardBg}
              boxShadow="md"
            >
              <Text fontSize="md" fontWeight="bold" color={textColor} mb={2}>
                Choose Your Donation
              </Text>

              {/* Donation Type Pills - Only show if at least one type is enabled */}
              {enabledTypes.length > 0 && (
                <HStack spacing={2} mb={3} flexWrap="wrap">
                  {enabledTypes.map((type) => (
                    <Box
                      key={type}
                      as="button"
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg={selectedDonationType === type ? selectedColor : "transparent"}
                      color={selectedDonationType === type ? "white" : subTextColor}
                      fontSize="2xs"
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
                <Grid templateColumns="repeat(2, 1fr)" gap={2} mb={3}>
                  {currentAmounts.slice(0, 4).map((item, index) => (
                    <Box
                      key={index}
                      p={2}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={cardBorder}
                      bg={isDarkMode ? "gray.800" : "gray.50"}
                      textAlign="center"
                      cursor="pointer"
                      transition="all 0.2s ease"
                      _hover={{
                        borderColor: selectedColor,
                        transform: "translateY(-1px)",
                      }}
                    >
                      <Text fontSize="md" fontWeight="bold" color={selectedColor}>
                        ${item.amount}
                      </Text>
                      <Text fontSize="3xs" color={subTextColor} lineHeight="1.2" noOfLines={2}>
                        {item.description}
                      </Text>
                    </Box>
                  ))}
                </Grid>
              )}

              {/* Custom Amount Section */}
              <Text fontSize="2xs" color={subTextColor} mb={1}>
                {enabledTypes.length > 0 ? "Or enter a custom amount" : "Enter donation amount"}
              </Text>
              <InputGroup size="sm" mb={4}>
                <InputLeftElement pointerEvents="none" h="100%">
                  <Text color={subTextColor} fontSize="xs">$</Text>
                </InputLeftElement>
                <Input
                  placeholder="Enter amount"
                  borderRadius="lg"
                  borderColor={cardBorder}
                  bg={isDarkMode ? "gray.800" : "white"}
                  color={textColor}
                  fontSize="xs"
                  _placeholder={{ color: subTextColor }}
                  _hover={{ borderColor: selectedColor }}
                  _focus={{ borderColor: selectedColor, boxShadow: `0 0 0 1px ${selectedColor}` }}
                />
              </InputGroup>

              {/* Continue to Payment Button */}
              <Button
                w="100%"
                borderRadius="xl"
                height="40px"
                fontSize="sm"
                fontWeight="semibold"
                bg={selectedColor}
                color="white"
                boxShadow="0 4px 14px -4px rgba(0, 0, 0, 0.3)"
                _hover={{
                  filter: "brightness(0.9)",
                  boxShadow: "0 6px 20px -4px rgba(0, 0, 0, 0.4)"
                }}
                _active={{ transform: "translateY(1px)" }}
              >
                Continue to Payment →
              </Button>
            </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
