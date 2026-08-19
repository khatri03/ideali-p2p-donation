import React from 'react';
import {
  Box, Button, ButtonGroup, Drawer, DrawerBody, DrawerCloseButton,
  DrawerContent, DrawerHeader, DrawerOverlay, Flex, Icon, Text, VStack,
} from '@chakra-ui/react';
import Loader from 'app/components/common/Loader';
import { MdCheck, MdClear, MdClose, MdFormatListNumbered, MdLaptop, MdPhoneIphone } from 'react-icons/md';
import MobilePreview from '../../preview/MobilePreview';
import DesktopPreview from '../../preview/DesktopPreview';
import MembershipWizard from '../../createMembership/MembershipWizard';
import SuccessModal from '../../createMembership/shared/SuccessModal';
import { WizardStep } from '../../types';
import { useCreateMembershipPage } from './useCreateMembershipPage';
import StepListItem from './StepListItem';

const STEPS: WizardStep[] = [
  { number: 1,  label: 'Membership Title' },
  { number: 2,  label: 'Description',        skippable: true },
  { number: 3,  label: 'Color',              skippable: true },
  { number: 4,  label: 'Banner',             skippable: true },
  { number: 5,  label: 'Payment Account' },
  { number: 6,  label: 'Pricing',            skippable: true },
  { number: 7,  label: 'Discount Coupons',   skippable: true },
  { number: 8,  label: 'Questions',          skippable: true },
  { number: 9,  label: 'Thank you Email',    skippable: true },
  { number: 10, label: 'Advance Settings',   skippable: true },
  { number: 11, label: 'Review' },
];

export default function CreateMembershipPage() {
  const {
    navigate, membershipIdParam,
    wizard,
    previewMode, setPreviewMode,
    showPreview, setShowPreview,
    isClosing, isSavingAndExiting, showConfetti,
    isSuccessOpen, onSuccessClose,
    isStepsOpen, onStepsOpen, onStepsClose,
    handleClosePreview, handlePublished, handleSaveAndExit,
  } = useCreateMembershipPage();

  const {
    currentStep, completedSteps, membershipId, setMembershipId,
    previewData, updatePreview, isLoadingSteps,
    goNext, goPrev, skipStep, goToStep, markStepComplete, isStepAccessible,
  } = wizard;

  return (
    <Box minH="100vh" bg="gray.50">

      {/* Header */}
      <Flex
        bg="white" borderBottomWidth="1px" borderColor="gray.200"
        px={{ base: 3, md: 6 }} py={4}
        alignItems="center" justifyContent="space-between"
        position="sticky" top={0} zIndex={10}
      >
        <Flex alignItems="center" gap={3} ml={{ base: 0, md: 12 }}>
          <Button
            onClick={() => navigate('/organizer/membership/manage')}
            variant="ghost" size="sm" borderRadius="full" p={1} minW="auto" h="auto"
            color="gray.500" _hover={{ bg: 'gray.100', color: 'gray.800' }}
            aria-label="Close wizard"
          >
            <Icon as={MdClear} boxSize={5} />
          </Button>
          <Text fontSize={{ base: 'sm', md: 'xl' }} fontWeight="bold" noOfLines={1}>
            Create Membership Type
          </Text>
        </Flex>

        <Flex alignItems="center" gap={2} flexShrink={0}>
          <Button
            display={{ base: 'flex', md: 'none' }} onClick={onStepsOpen}
            variant="outline" size="sm" leftIcon={<Icon as={MdFormatListNumbered} boxSize={4} />}
            borderColor="gray.300" color="gray.700" _hover={{ bg: 'gray.50' }}
          >
            <Text display={{ base: 'none', sm: 'block' }}>Steps</Text>
          </Button>
          <Button
            leftIcon={showPreview ? <MdClose /> : <MdPhoneIphone />}
            onClick={() => showPreview ? handleClosePreview() : setShowPreview(true)}
            colorScheme={showPreview ? 'red' : 'blue'} variant="outline" size="sm"
          >
            <Text display={{ base: 'none', sm: 'block' }}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Text>
          </Button>
        </Flex>
      </Flex>

      <Flex h="calc(100vh - 73px)" gap={0} position="relative">
        <Box w={{ base: '0', md: '70px' }} flexShrink={0} />

        {/* Collapsible sidebar — desktop */}
        <Box
          w={{ base: '0', md: '70px' }} bg="white" borderRightWidth="1px" borderColor="gray.200"
          overflowY="auto" overflowX="hidden" p={2} transition="all 0.3s ease"
          position="absolute" left={0} top={0} bottom={0} zIndex={5}
          display={{ base: 'none', md: 'block' }}
          _hover={{ w: '250px', px: 4, boxShadow: '2xl' }}
          sx={{
            '&:hover .step-label': { opacity: 1, width: 'auto', ml: 3 },
            '&:hover .sidebar-title': { opacity: 1 },
            '::-webkit-scrollbar': { width: '0px', display: 'none' },
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}
        >
          <Text
            className="sidebar-title" fontSize="sm" fontWeight="bold" color="gray.500"
            mb={4} textTransform="uppercase" opacity={0} transition="opacity 0.3s ease" whiteSpace="nowrap"
          >
            Form Steps
          </Text>
          <VStack spacing={2} align="stretch">
            {STEPS.map((step) => (
              <StepListItem
                key={step.number} step={step} collapsed
                isCompleted={completedSteps.includes(step.number)}
                isActive={currentStep === step.number}
                accessible={isStepAccessible(step.number)}
                onStepClick={() => goToStep(step.number)}
              />
            ))}
          </VStack>
        </Box>

        {/* Main wizard area */}
        <Box
          flex={{ base: '1', md: showPreview ? '0.6' : '1' }}
          overflowY="auto" bg="white" p={{ base: 3, md: 6 }}
          borderRightWidth={{ base: '0', md: '1px' }} borderColor="gray.200"
          transition="flex 0.3s ease"
        >
          {isLoadingSteps ? (
            <Flex justify="center" align="center" h="100%">
              <Loader message="Loading Membership" subtitle="Fetching your saved progress..." />
            </Flex>
          ) : (
            <MembershipWizard
              currentStep={currentStep}
              membershipId={membershipIdParam ?? membershipId}
              onMembershipCreated={setMembershipId}
              onStepComplete={markStepComplete}
              onNext={goNext} onPrev={goPrev} onSkip={skipStep}
              onPublished={handlePublished}
              onSaveAndExit={handleSaveAndExit}
              isSavingAndExiting={isSavingAndExiting}
              onPreviewUpdate={updatePreview}
            />
          )}
        </Box>

        {/* Preview panel */}
        {showPreview && (
          <Box
            flex={{ base: 'none', md: '0.4' }} bg="gray.50" display="flex" flexDirection="column"
            borderLeftWidth={{ base: '0', md: '1px' }} borderColor="gray.200"
            transition={{ base: 'transform 0.3s ease-in-out', md: 'all 0.3s ease' }}
            overflow="hidden"
            position={{ base: 'fixed', md: 'relative' }}
            top={{ base: 0, md: 'auto' }} right={{ base: 0, md: 'auto' }}
            bottom={{ base: 0, md: 'auto' }}
            zIndex={{ base: 50, md: 'auto' }}
            w={{ base: '100vw', md: 'auto' }} h={{ base: '100vh', md: 'auto' }}
            transform={{ base: isClosing ? 'translateX(100%)' : 'translateX(0)', md: 'none' }}
            sx={{
              '@keyframes slideInFromRight': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
              animation: { base: isClosing ? 'none' : 'slideInFromRight 0.3s ease-out', md: 'none' },
            }}
          >
            <Flex justifyContent="space-between" alignItems="center" py={2} px={3}>
              <Button
                aria-label="Close preview" onClick={handleClosePreview}
                size="md" colorScheme="red" variant="ghost"
                display={{ base: 'flex', md: 'none' }} borderRadius="full"
              >✕</Button>
              <Box flex="1" display="flex" justifyContent="center">
                <ButtonGroup size="xs" isAttached variant="outline">
                  <Button
                    leftIcon={<Icon as={MdPhoneIphone} boxSize={3} />}
                    onClick={() => setPreviewMode('mobile')}
                    colorScheme={previewMode === 'mobile' ? 'blue' : 'gray'}
                    variant={previewMode === 'mobile' ? 'solid' : 'outline'}
                    fontSize="xs" px={2}
                  >Mobile</Button>
                  <Button
                    leftIcon={<Icon as={MdLaptop} boxSize={3} />}
                    onClick={() => setPreviewMode('desktop')}
                    colorScheme={previewMode === 'desktop' ? 'blue' : 'gray'}
                    variant={previewMode === 'desktop' ? 'solid' : 'outline'}
                    fontSize="xs" px={2}
                  >Desktop</Button>
                </ButtonGroup>
              </Box>
            </Flex>
            <Box flex="1" overflowY="auto" overflowX="auto" p={{ base: 3, md: 5 }}>
              <Box display="flex" alignItems="center" justifyContent="center" minH="100%" w="100%">
                {previewMode === 'mobile' ? <MobilePreview {...previewData} /> : <DesktopPreview {...previewData} />}
              </Box>
            </Box>
          </Box>
        )}
      </Flex>

      {/* Mobile steps drawer */}
      <Drawer isOpen={isStepsOpen} onClose={onStepsClose} placement="left" size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor="gray.200"
            fontSize="sm" fontWeight="bold" color="gray.600" textTransform="uppercase" letterSpacing="wide"
          >
            Form Steps
          </DrawerHeader>
          <DrawerBody p={2} overflowY="auto">
            <VStack spacing={2} align="stretch">
              {STEPS.map((step) => (
                <StepListItem
                  key={step.number} step={step}
                  isCompleted={completedSteps.includes(step.number)}
                  isActive={currentStep === step.number}
                  accessible={isStepAccessible(step.number)}
                  onStepClick={() => { goToStep(step.number); onStepsClose(); }}
                />
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <SuccessModal isOpen={isSuccessOpen} onClose={onSuccessClose} showConfetti={showConfetti} />
    </Box>
  );
}
