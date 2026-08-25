import { useState } from 'react';
import { Alert, AlertIcon, Box, Button, Stack, Text } from '@chakra-ui/react';
import { SupporterSignUpRequest } from 'app/interface/donationInter/supporterSignUpDto';
import { signUpAsSupporter } from 'app/service/organizer/donation/supporterSignUpService';
import { resendConfirmationEmail } from 'app/service/organizer/donation/emailVerificationService';
import { extractApiError } from 'app/utils/apiError';
import SupporterSignUpForm from '../signUp/SupporterSignUpForm';
import { useSupporterSignUpForm } from '../signUp/useSupporterSignUpForm';
import { SIGN_UP_INTRO } from '../signUp/signUpCopy';
import PanelSwitchPrompt from './PanelSwitchPrompt';
import {
  CHECK_YOUR_INBOX_HEADING,
  RESEND_FAILED,
  RESEND_PROMPT,
  RESEND_SUBMIT,
  RESEND_WORKING,
  TO_SIGN_IN_ACTION,
  TO_SIGN_IN_PROMPT,
} from './accessCopy';

interface SupporterSignUpPanelProps {
  campaignUniqueId: string;
  onSwitchToSignIn: () => void;
}

/**
 * The create-account half of the fundraising modal. A completed sign-up does not sign anybody in:
 * the account exists but its address is unproven, and the link sent by email is what settles that.
 */
export const SupporterSignUpPanel = ({
  campaignUniqueId,
  onSwitchToSignIn,
}: SupporterSignUpPanelProps) => {
  const form = useSupporterSignUpForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);
  const [signedUpAddress, setSignedUpAddress] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (request: SupporterSignUpRequest) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const message = await signUpAsSupporter(campaignUniqueId, request);
      setSignedUpAddress(request.emailAddress);
      setCompletedMessage(message);
    } catch (error) {
      setSubmitError(extractApiError(error, 'Your account could not be created.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage(null);

    try {
      setResendMessage(await resendConfirmationEmail(campaignUniqueId, signedUpAddress));
    } catch (error) {
      setResendMessage(extractApiError(error, RESEND_FAILED));
    } finally {
      setIsResending(false);
    }
  };

  if (completedMessage) {
    return (
      <Stack gap={4}>
        <Alert status="success" borderRadius="12px" alignItems="flex-start">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="600">{CHECK_YOUR_INBOX_HEADING}</Text>
            <Text fontSize="sm" mt={1}>
              {completedMessage}
            </Text>
          </Box>
        </Alert>

        <Stack gap={2}>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {RESEND_PROMPT}
          </Text>
          <Button
            variant="outline"
            colorScheme="brand"
            minH="44px"
            w={{ base: 'full', md: 'auto' }}
            alignSelf={{ base: 'stretch', md: 'flex-start' }}
            isDisabled={isResending}
            isLoading={isResending}
            loadingText={RESEND_WORKING}
            onClick={handleResend}
            sx={{ cursor: isResending ? 'not-allowed' : 'pointer' }}
          >
            {RESEND_SUBMIT}
          </Button>
          {resendMessage && (
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} role="status">
              {resendMessage}
            </Text>
          )}
        </Stack>

        <PanelSwitchPrompt
          prompt={TO_SIGN_IN_PROMPT}
          action={TO_SIGN_IN_ACTION}
          onSwitch={onSwitchToSignIn}
        />
      </Stack>
    );
  }

  return (
    <Stack gap={5}>
      <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
        {SIGN_UP_INTRO}
      </Text>

      {submitError && (
        <Alert status="error" borderRadius="12px" role="alert">
          <AlertIcon />
          <Text fontSize="sm">{submitError}</Text>
        </Alert>
      )}

      <SupporterSignUpForm form={form} isSubmitting={isSubmitting} onSubmit={handleSubmit} />

      <PanelSwitchPrompt
        prompt={TO_SIGN_IN_PROMPT}
        action={TO_SIGN_IN_ACTION}
        onSwitch={onSwitchToSignIn}
      />
    </Stack>
  );
};

export default SupporterSignUpPanel;
