import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, Flex, Text, IconButton, VStack, Icon, Button, ButtonGroup, useBreakpointValue, useToast } from '@chakra-ui/react';
import { MdArrowBack, MdPhoneIphone, MdClose, MdLaptop, MdSave, MdCheck } from 'react-icons/md';
import CreateDonation from './createDonation';
import MobilePreview from './mobilePreview';
import DesktopPreview from './desktopPreview';
import donationService from '../../../service/organizer/donation/donationService';
import Loader from '../../common/Loader';
import { useDisclosure } from '@chakra-ui/react';
import { useAppDispatch } from '../../../../store/hooks';
import { resetCampaignForm } from '../../../../store/slices/donationSlice';

export default function CreateDonationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get initial step from URL query params (for resume functionality)
  const initialStepFromUrl = searchParams.get('step');
  const [currentStep, setCurrentStep] = useState(
    initialStepFromUrl ? parseInt(initialStepFromUrl, 10) : 1
  );
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [showPreview, setShowPreview] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [saveAndExitTrigger, setSaveAndExitTrigger] = useState(0);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [previewData, setPreviewData] = useState({
    name: '',
    description: '',
    fundRaisingGoal: 0,
    selectedColor: '#3182CE',
    startDate: new Date(),
    endDate: new Date(),
    bannerImage: null as string | null,
    showFundraisingGoal: true,
    presetAmounts: {
      oneTime: {
        enabled: true,
        amounts: [
          { amount: 10, description: 'Can help feeding 10 children' },
          { amount: 25, description: 'Can help feeding 25 children' },
          { amount: 50, description: 'Can help feeding 50 children' },
          { amount: 100, description: 'Can help feeding 100 children' },
        ],
      },
      monthly: {
        enabled: false,
        amounts: [] as { amount: number; description: string }[],
      },
      yearly: {
        enabled: false,
        amounts: [] as { amount: number; description: string }[],
      },
    },
  });

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!campaignId) {
        // If no campaignId, reset the Redux form state for a new campaign
        dispatch(resetCampaignForm());
        return;
      }

      setIsLoadingCampaign(true);
      try {
        const data = await donationService.getCampaignDetailForEdit(campaignId);
        console.log('Campaign data fetched:', data);
        setCampaignData(data);

        // Also fetch completed steps
        const completedSteps = await donationService.getCompletedSteps(campaignId);
        setCompletedSteps(completedSteps);
      } catch (error) {
        console.error('Error fetching campaign data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load campaign data. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingCampaign(false);
      }
    };

    fetchCampaignData();
  }, [campaignId, toast, dispatch]);

  // Set showPreview to true on desktop screens initially
  useEffect(() => {
    if (isDesktop !== undefined) {
      setShowPreview(isDesktop);
    }
  }, [isDesktop]);

  const handleClosePreview = () => {
    if (!isDesktop) {
      setIsClosing(true);
      setTimeout(() => {
        setShowPreview(false);
        setIsClosing(false);
      }, 300); // Match animation duration
    } else {
      setShowPreview(false);
    }
  };

  // Helper function to check if a step has data
  const stepHasData = (stepNumber: number): boolean => {
    if (!campaignData) return false;

    switch (stepNumber) {
      case 1: // Basic Information
        return !!(campaignData.title || campaignData.startDate);
      case 2: // Set Goal
        return !!campaignData.goalAmount;
      case 3: // Add Description
        return !!campaignData.description;
      case 4: // Payment Account
        return !!(campaignData.paymentAccountId || campaignData.paymentMethods?.length > 0);
      case 5: // Preset Donation
        return !!campaignData.presetAmounts?.length;
      case 6: // Campaign Color
        return !!campaignData.themeColor;
      case 7: // Select Banner
        return !!campaignData.images?.length;
      case 8: // Thank You Email
        return false; // Step 8 data not yet implemented
      case 9: // Review & Confirm
        return true; // Always accessible
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, label: 'Basic Information' },
    { number: 2, label: 'Set Goal' },
    { number: 3, label: 'Add Description' },
    { number: 4, label: 'Payment Account' },
    { number: 5, label: 'Preset Donation' },
    { number: 6, label: 'Campaign Color' },
    { number: 7, label: 'Select Banner' },
    { number: 8, label: 'Thank You Email' },
    { number: 9, label: 'Review & Confirm' },
  ];

  const handleFormDataChange = React.useCallback((data: typeof previewData) => {
    setPreviewData(data);
  }, []);

  const handleStepChange = React.useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handleStepComplete = React.useCallback((step: number) => {
    setCompletedSteps((prev) => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
  }, []);


// Handler for confirm exit
const handleConfirmExit = () => {
  onClose();
  navigate(-1);
};

// Handler for save and exit button
const handleSaveAndExit = () => {
  setIsSavingAndExiting(true);
  setSaveAndExitTrigger((prev) => prev + 1);
};

// Callback when save and exit completes
const handleSaveAndExitComplete = () => {
  setIsSavingAndExiting(false);
  navigate('/organizer/donation/manage-donation-module');
};

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Flex
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        px={6}
        py={4}
        alignItems="center"
        justifyContent="space-between"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex alignItems="center" ml={12}>
          <Text fontSize="xl" fontWeight="bold">
            Create Donation Campaign
          </Text>
        </Flex>

        <Flex alignItems="center" gap={3}>
          <Button
            leftIcon={showPreview ? <MdClose /> : <MdPhoneIphone />}
            onClick={() => showPreview ? handleClosePreview() : setShowPreview(true)}
            colorScheme={showPreview ? 'red' : 'blue'}
            variant="outline"
            size="sm"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </Flex>
      </Flex>

      <Flex h="calc(100vh - 73px)" gap={0} position="relative">
        {/* Spacer for sidebar */}
        <Box w={{ base: "0", md: "70px" }} flexShrink={0} />

        <Box
          w={{ base: "0", md: "70px" }}
          bg="white"
          borderRightWidth="1px"
          borderColor="gray.200"
          overflowY="auto"
          overflowX="hidden"
          p={2}
          transition="all 0.3s ease"
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          zIndex={5}
          display={{ base: "none", md: "block" }}
          _hover={{
            w: '250px',
            px: 4,
            boxShadow: '2xl',
          }}
          sx={{
            '&:hover .step-label': {
              opacity: 1,
              width: 'auto',
              ml: 3,
            },
            '&:hover .sidebar-title': {
              opacity: 1,
            },
            '::-webkit-scrollbar': {
              width: '0px',
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <Text
            className="sidebar-title"
            fontSize="sm"
            fontWeight="bold"
            color="gray.500"
            mb={4}
            textTransform="uppercase"
            opacity={0}
            transition="opacity 0.3s ease"
            whiteSpace="nowrap"
          >
            Form Steps
          </Text>
          <VStack spacing={2} align="stretch">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.number);
              const hasData = stepHasData(step.number);
              const isActive = currentStep === step.number;

              // A step is accessible if:
              // Both modes: Allow access to any step up to the highest step reached (current step or completed steps)
              const highestStepReached = Math.max(
                currentStep, // Current step
                completedSteps.length > 0 ? Math.max(...completedSteps) : 1 // Highest completed step
              );
              const isAccessible = step.number <= highestStepReached;

              return (
                <Box
                  key={step.number}
                  px={2}
                  py={3}
                  borderRadius="lg"
                  cursor={isAccessible ? "pointer" : "not-allowed"}
                  opacity={isAccessible ? 1 : 0.5}

                  bg={
                    isCompleted
                      ? 'green.50'
                      : (step.number === 9 && hasData)
                      ? 'orange.50'
                      : isActive
                      ? 'blue.50'
                      : 'transparent'
                  }
                  borderWidth="1px"
                  borderColor={
                    isCompleted
                      ? 'green.300'
                      : (step.number === 9 && hasData)
                      ? 'orange.300'
                      : isActive
                      ? 'blue.300'
                      : 'transparent'
                  }
                  _hover={isAccessible ? {
                    bg: isCompleted
                      ? 'green.100'
                      : (step.number === 9 && hasData)
                      ? 'orange.100'
                      : isActive
                      ? 'blue.50'
                      : 'gray.50',
                    borderColor: isCompleted
                      ? 'green.400'
                      : (step.number === 9 && hasData)
                      ? 'orange.400'
                      : isActive
                      ? 'blue.300'
                      : 'gray.200',
                  } : {}}
                  transition="all 0.2s"
                  onClick={() => {
                    if (isAccessible) {
                      setCurrentStep(step.number);
                    }
                  }}
                >
                  <Flex align="center" gap={0}>
                    <Box position="relative" flexShrink={0}>
                      <Flex
                        align="center"
                        justify="center"
                        w="32px"
                        h="32px"
                        borderRadius="full"
                        borderWidth={isCompleted ? "2px" : "0"}
                        borderColor={isCompleted ? "#27C281" : "transparent"}
                        bg={
                          isCompleted
                            ? 'green.50'
                            : (step.number === 9 && hasData)
                            ? 'orange.500'
                            : isActive
                            ? 'blue.500'
                            : 'gray.200'
                        }
                        color={
                          isCompleted 
                            ? '#27C281' 
                            : (step.number === 9 && hasData || isActive) 
                              ? 'white' 
                              : 'gray.500'
                        }
                        fontSize="sm"
                        fontWeight="bold"
                        transition="all 0.2s"
                      >
                        {step.number === 9 && hasData && !isCompleted ? '◐' : step.number}
                      </Flex>
                      {isCompleted && (
                        <Flex
                          position="absolute"
                          top="-3px"
                          right="-3px"
                          bg="#27C281"
                          borderRadius="full"
                          w="16px"
                          h="16px"
                          align="center"
                          justify="center"
                          border="1.5px solid white"
                          boxShadow="sm"
                        >
                          <Icon as={MdCheck} color="white" boxSize="10px" fontWeight="bold" />
                        </Flex>
                      )}
                    </Box>
                    <Text
                      className="step-label"
                      fontSize="sm"
                      fontWeight={isActive ? 'semibold' : 'medium'}
                      color={
                        isCompleted
                          ? 'green.700'
                          : (step.number === 9 && hasData)
                          ? 'orange.700'
                          : isActive
                          ? 'blue.700'
                          : 'gray.700'
                      }
                      noOfLines={2}
                      opacity={0}
                      width={0}
                      overflow="hidden"
                      transition="all 0.3s ease"
                      whiteSpace="nowrap"
                    >
                      {step.label}
                    </Text>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        </Box>

        <Box
          flex={{ base: "1", md: showPreview ? "0.6" : "1" }}
          overflowY="auto"
          bg="white"
          p={6}
          borderRightWidth={{ base: "0", md: "1px" }}
          borderColor="gray.200"
          transition="flex 0.3s ease"
        >
          {isLoadingCampaign ? (
            <Box display="flex" alignItems="center" justifyContent="center" minH="400px">
              <Loader
                message="Loading Campaign Data..."
                subtitle="Please wait while we fetch your campaign details"
              />
            </Box>
          ) : (
            <CreateDonation
              onFormDataChange={handleFormDataChange}
              onStepChange={handleStepChange}
              onStepComplete={handleStepComplete}
              initialStep={currentStep}
              campaignId={campaignId}
              initialData={(() => {
                if (!campaignData) return undefined;

                const initialDataToPass = {
                  // Step 1: Basic Information
                  name: campaignData.title || '',
                  startDate: campaignData.startDate || new Date().toString(),
                  endDate: campaignData.endDate || null,

                  // Step 2: Set Goal
                  fundRaisingGoal: campaignData.goalAmount || null,
                  visibleToDonor: campaignData.visibleToDonor !== undefined ? campaignData.visibleToDonor : true,

                  // Step 3: Add Description
                  description: campaignData.description || '',

                  // Step 4: Payment Account
                  paymentAccountId: campaignData.paymentAccountId || 0,
                  paymentMethods: (() => {
                    if (!campaignData.paymentMethods) return [];
                    // If it's already an array of primitives (numbers/strings), return as-is
                    if (typeof campaignData.paymentMethods[0] === 'number' || typeof campaignData.paymentMethods[0] === 'string') {
                      return campaignData.paymentMethods.map(String);
                    }
                    // If it's an array of objects, extract the value property
                    return campaignData.paymentMethods.map((pm: any) => String(pm.value || pm.id || pm.name || pm));
                  })(),

                  // Step 5: Preset Donation amounts
                  presetAmounts: campaignData.presetAmounts || [],

                  // Step 6: Campaign Color
                  themeColor: campaignData.themeColor || '#044bd9',
                  selectedColor: campaignData.themeColor || '#3182CE',

                  // Step 7: Banner Image
                  bannerImage: campaignData.images?.[0] || null,

                  // Additional settings
                  enableMonthlyRecurring: campaignData.enableMonthlyRecurring || false,
                  enableYearlyRecurring: campaignData.enableYearlyRecurring || false,
                  customFormId: campaignData.customFormId || null,
                };

                console.log('Passing initialData to CreateDonation:', initialDataToPass);
                console.log('Raw campaignData:', campaignData);

                return initialDataToPass;
              })()}
            />
          )}
        </Box>

        {showPreview && (
          <Box
            flex={{ base: "none", md: "0.4" }}
            bg="gray.50"
            display="flex"
            flexDirection="column"
            borderLeftWidth={{ base: "0", md: "1px" }}
            borderColor="gray.200"
            transition={{ base: "transform 0.3s ease-in-out", md: "all 0.3s ease" }}
            overflow="hidden"
            position={{ base: "fixed", md: "relative" }}
            top={{ base: 0, md: "auto" }}
            left={{ base: "auto", md: "auto" }}
            right={{ base: 0, md: "auto" }}
            bottom={{ base: 0, md: "auto" }}
            zIndex={{ base: 50, md: "auto" }}
            w={{ base: "100vw", md: "auto" }}
            h={{ base: "100vh", md: "auto" }}
            transform={{
              base: isClosing ? "translateX(100%)" : "translateX(0)",
              md: "none"
            }}
            sx={{
              '@keyframes slideInFromRight': {
                from: {
                  transform: 'translateX(100%)',
                },
                to: {
                  transform: 'translateX(0)',
                },
              },
              animation: {
                base: isClosing ? 'none' : 'slideInFromRight 0.3s ease-out',
                md: 'none'
              },
            }}
          >
            <Flex
              justifyContent="space-between"
              alignItems="center"
              py={2}
              px={3}
              position="relative"
              boxShadow="none"
              borderBottom="none"
            >
              <IconButton
                aria-label="Close preview"
                icon={<Icon as={MdClose} boxSize={5} />}
                onClick={handleClosePreview}
                size="md"
                colorScheme="red"
                variant="ghost"
                display={{ base: "flex", md: "none" }}
                borderRadius="full"
                _hover={{ bg: "red.100" }}
              />
              <Box flex="1" display="flex" justifyContent="center">
                <ButtonGroup size="xs" isAttached variant="outline">
                  <Button
                    leftIcon={<Icon as={MdPhoneIphone} boxSize={3} />}
                    onClick={() => setPreviewMode('mobile')}
                    colorScheme={previewMode === 'mobile' ? 'blue' : 'gray'}
                    variant={previewMode === 'mobile' ? 'solid' : 'outline'}
                    fontSize="xs"
                    px={2}
                  >
                    Mobile
                  </Button>
                  <Button
                    leftIcon={<Icon as={MdLaptop} boxSize={3} />}
                    onClick={() => setPreviewMode('desktop')}
                    colorScheme={previewMode === 'desktop' ? 'blue' : 'gray'}
                    variant={previewMode === 'desktop' ? 'solid' : 'outline'}
                    fontSize="xs"
                    px={2}
                  >
                    Desktop
                  </Button>
                </ButtonGroup>
              </Box>
            </Flex>
            <Box
              flex="1"
              overflowY="auto"
              overflowX="auto"
              p={{ base: 3, md: 5 }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="100%"
                w="100%"
              >
              {previewMode === 'mobile' ? (
                <MobilePreview
                  name={previewData.name}
                  description={previewData.description}
                  fundRaisingGoal={previewData.fundRaisingGoal}
                  selectedColor={previewData.selectedColor}
                  startDate={previewData.startDate}
                  endDate={previewData.endDate}
                  bannerImage={previewData.bannerImage}
                  showFundraisingGoal={previewData.showFundraisingGoal}
                  presetAmounts={previewData.presetAmounts}
                />
              ) : (
                <DesktopPreview
                  name={previewData.name}
                  description={previewData.description}
                  fundRaisingGoal={previewData.fundRaisingGoal}
                  selectedColor={previewData.selectedColor}
                  startDate={previewData.startDate}
                  endDate={previewData.endDate}
                  bannerImage={previewData.bannerImage}
                  showFundraisingGoal={previewData.showFundraisingGoal}
                  presetAmounts={previewData.presetAmounts}
                />
              )}
              </Box>
            </Box>
          </Box>
        )}
      </Flex>


    </Box>

    
  );
}
