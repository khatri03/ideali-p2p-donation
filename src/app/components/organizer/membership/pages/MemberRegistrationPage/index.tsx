import React, { useEffect } from 'react';
import {
  Alert, AlertDescription, AlertIcon, AlertTitle,
  Box, CloseButton, Flex, Spinner, Text, VStack,
} from '@chakra-ui/react';
import Loader from 'app/components/common/Loader';
import { useMemberRegistration } from './useMemberRegistration';
import Step1MembershipInfo from '../../memberRegistration/Step1MembershipInfo';
import Step2YourInformation from '../../memberRegistration/Step2YourInformation';
import Step3Questionnaire from '../../memberRegistration/Step3Questionnaire';
import Step4Payment from '../../memberRegistration/Step4Payment';
import RegistrationFooter from '../../memberRegistration/RegistrationFooter';
import RegistrationSuccessModal from '../../memberRegistration/RegistrationSuccessModal';

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Membership Info' },
  { n: 2, label: 'Your Information' },
  { n: 3, label: 'Questionnaire' },
  { n: 4, label: 'Payment' },
];

function StepIndicator({
  current, maxReached, onStepClick, color = '#044bd9',
}: {
  current: number;
  maxReached: number;
  onStepClick: (n: number) => void;
  color?: string;
}) {
  const colorLight = color + '22'; // ~13% opacity for visited bg
  return (
    <Flex bg="white" borderBottom="1px solid" borderColor="gray.200">
      {STEPS.map((step) => {
        const active    = step.n === current;
        const visited   = step.n <= maxReached && !active;
        const clickable = step.n <= maxReached;
        return (
          <Flex
            key={step.n} flex={1} direction="column" align="center" pt={4} pb={3}
            borderBottom="3px solid"
            borderColor={active ? color : 'transparent'}
            style={{ borderBottomColor: active ? color : 'transparent' }}
            cursor={clickable ? 'pointer' : 'default'}
            onClick={() => clickable && onStepClick(step.n)}
            _hover={clickable ? { bg: 'gray.50' } : undefined}
            transition="background 0.15s"
          >
            <Flex
              w={{ base: '28px', sm: '36px' }} h={{ base: '28px', sm: '36px' }}
              borderRadius="full" mb={1.5} border="2px solid"
              align="center" justify="center" fontSize="xs" fontWeight="bold"
              style={{
                background: active ? color : visited ? colorLight : undefined,
                borderColor: active ? color : visited ? color + '66' : '#e2e8f0',
                color: active ? 'white' : visited ? color : '#a0aec0',
              }}
            >
              {String(step.n).padStart(2, '0')}
            </Flex>
            <Text
              fontSize="xs" fontWeight={active ? 'semibold' : 'normal'}
              display={{ base: 'none', sm: 'block' }}
              style={{ color: active ? color : visited ? '#718096' : '#a0aec0' }}
            >
              {step.label}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberRegistrationPage() {
  const {
    navigate, membershipId,
    currentStep, setCurrentStep, maxReachedStep,
    info, isLoading, error,
    themeColor,
    step2Data, setStep2Data,
    step3Data, setStep3Data,
    isSubmitting,
    serverErrors, setServerErrors,
    successData,
    handleComplete, handleSuccessDone,
    goNext, goBack,
  } = useMemberRegistration();

  useEffect(() => {
    // Keep each step anchored at the top so the first required fields stay visible on mobile.
    window.scrollTo(0, 0);
  }, [currentStep]);

  return (
    <Box minH="100vh" bg="gray.100" display="flex" flexDirection="column">
      <Box bg="white" flex={1} display="flex" flexDirection="column">

        {/* Sticky navbar + step indicator */}
        <Box position="sticky" top={0} zIndex={20} bg="white" boxShadow="0 2px 8px rgba(0,0,0,0.06)">
          <Flex as="nav" align="center" justify="center" px={{ base: 4, md: 8 }} py={4}
            bg="white" borderBottom="1px solid" borderColor="gray.100"
          >
            <Text fontSize="lg" fontWeight="bold" color="gray.900" letterSpacing="tight">
              Add Member
            </Text>
          </Flex>
          <StepIndicator current={currentStep} maxReached={maxReachedStep} onStepClick={setCurrentStep} color={themeColor} />
        </Box>

        {/* Validation errors */}
        {serverErrors.length > 0 && (
          <Alert status="error" variant="left-accent" borderRadius="lg" mx={{ base: 3, md: 6 }} mt={3} alignItems="flex-start">
            <AlertIcon mt={0.5} />
            <Box flex={1}>
              <AlertTitle fontSize="sm" fontWeight="bold">Please fix the following errors:</AlertTitle>
              <AlertDescription>
                <VStack align="start" spacing={0.5} mt={1}>
                  {serverErrors.map((e, i) => <Text key={i} fontSize="sm">• {e}</Text>)}
                </VStack>
              </AlertDescription>
            </Box>
            <CloseButton onClick={() => setServerErrors([])} size="sm" alignSelf="flex-start" />
          </Alert>
        )}

        {/* Step content */}
        {isLoading ? (
          <Flex flex={1} align="center" justify="center" py={20}>
            <Spinner size="lg" color="blue.500" />
          </Flex>
        ) : error || !info ? (
          <Flex flex={1} align="center" justify="center" py={20} px={6}>
            <Box textAlign="center" maxW="400px">
              <Text fontSize="3xl" mb={3}>🔒</Text>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={2}>Registration Unavailable</Text>
              <Text fontSize="sm" color="gray.500">{error ?? 'This membership is not currently available for registration.'}</Text>
            </Box>
          </Flex>
        ) : (
          <>
            {currentStep === 1 && (
              <Step1MembershipInfo info={info} onContinue={goNext} onCancel={() => navigate(-1)} />
            )}
            {currentStep === 2 && (
              <Step2YourInformation
                initialData={step2Data ?? undefined}
                onBack={goBack}
                onContinue={(data) => { setStep2Data(data); goNext(); }}
                themeColor={themeColor}
              />
            )}
            {currentStep === 3 && (
              <Step3Questionnaire
                customForms={info.membershipDetail.customForms}
                customQuestions={info.membershipDetail.customQuestions}
                initialValues={step3Data ?? undefined}
                onBack={goBack}
                onContinue={(data) => { setStep3Data(data); goNext(); }}
                themeColor={themeColor}
              />
            )}
            {currentStep === 4 && (
              <Step4Payment
                info={info}
                membershipId={membershipId!}
                onBack={goBack}
                onComplete={handleComplete}
                isSubmitting={isSubmitting}
                themeColor={themeColor}
                contactInfo={{
                  firstName: step2Data?.firstName ?? '',
                  middleName: step2Data?.middleName || undefined,
                  lastName: step2Data?.lastName ?? '',
                  primaryEmail: step2Data?.email ?? '',
                  cellPhone: step2Data?.cellPhone ?? '',
                }}
              />
            )}
          </>
        )}
      </Box>

      {/* Submission loader overlay */}
      {isSubmitting && (
        <Box position="fixed" inset={0} zIndex={50} bg="whiteAlpha.800" backdropFilter="blur(3px)"
          display="flex" alignItems="center" justifyContent="center"
        >
          <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200"
            boxShadow="0 8px 32px rgba(0,0,0,0.12)" px={10} py={6}
          >
            <Loader message="Submitting Registration" subtitle="Please wait while we process your registration..." />
          </Box>
        </Box>
      )}

      {successData && info && (
        <RegistrationSuccessModal
          isOpen
          memberName={successData.memberName}
          membershipName={info.membershipDetail.name}
          onDone={handleSuccessDone}
        />
      )}
    </Box>
  );
}
