import { FormEvent } from 'react';
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import TwoFactorAuthModal from 'app/components/auth/TwoFactorAuthModal';
import {
  SIGN_IN_EMAIL_LABEL,
  SIGN_IN_INTRO,
  SIGN_IN_PASSWORD_LABEL,
  SIGN_IN_SUBMIT,
  SIGN_IN_WORKING,
} from './accessCopy';
import { SupporterSignInState } from './useSupporterSignIn';

interface SupporterSignInPanelProps {
  signIn: SupporterSignInState;
}

/**
 * The sign-in half of the fundraising modal. It is a form and nothing more: the session is
 * established by the shared login code, which is what keeps two-factor verification from being
 * something this surface could quietly skip.
 */
export const SupporterSignInPanel = ({ signIn }: SupporterSignInPanelProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void signIn.submit();
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap={5}>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="secondaryGray.600">
            {SIGN_IN_INTRO}
          </Text>

          {signIn.submitError && (
            <Alert status="error" borderRadius="12px" role="alert">
              <AlertIcon />
              <Text fontSize="sm">{signIn.submitError}</Text>
            </Alert>
          )}

          <FormControl isRequired isInvalid={Boolean(signIn.errors.emailAddress)}>
            <FormLabel htmlFor="supporter-sign-in-email" fontSize="sm">
              {SIGN_IN_EMAIL_LABEL}
            </FormLabel>
            <Input
              id="supporter-sign-in-email"
              type="email"
              autoComplete="email"
              minH="44px"
              value={signIn.values.emailAddress}
              isDisabled={signIn.isSubmitting}
              onChange={(event) => signIn.setValue('emailAddress', event.target.value)}
            />
            <FormErrorMessage>{signIn.errors.emailAddress}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={Boolean(signIn.errors.password)}>
            <FormLabel htmlFor="supporter-sign-in-password" fontSize="sm">
              {SIGN_IN_PASSWORD_LABEL}
            </FormLabel>
            <Input
              id="supporter-sign-in-password"
              type="password"
              autoComplete="current-password"
              minH="44px"
              value={signIn.values.password}
              isDisabled={signIn.isSubmitting}
              onChange={(event) => signIn.setValue('password', event.target.value)}
            />
            <FormErrorMessage>{signIn.errors.password}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            minH="44px"
            w="full"
            isDisabled={signIn.isSubmitting}
            isLoading={signIn.isSubmitting}
            loadingText={SIGN_IN_WORKING}
            sx={{ cursor: signIn.isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {SIGN_IN_SUBMIT}
          </Button>
        </Stack>
      </form>

      {signIn.twoFactorToken !== null && (
        <TwoFactorAuthModal
          isOpen
          onClose={signIn.cancelTwoFactor}
          onVerify={signIn.verifyTwoFactorCode}
          onBackToSignIn={signIn.cancelTwoFactor}
        />
      )}
    </>
  );
};

export default SupporterSignInPanel;
