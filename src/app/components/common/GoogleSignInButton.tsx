import { Button, useColorModeValue } from '@chakra-ui/react';
import { TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { isGoogleAuthEnabled } from '../../../utils/env';

type GoogleTokenResponse = Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>;

export interface GoogleSignInButtonProps {
  label: string;
  loadingText: string;
  isLoading: boolean;
  onSuccess: (tokenResponse: GoogleTokenResponse) => void;
  onError: () => void;
}

const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const GoogleSignInButtonInner = ({
  label,
  loadingText,
  isLoading,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) => {
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const borderColor = useColorModeValue('#E0E5F2', '#2D3748');
  const backgroundColor = useColorModeValue('white', '#1B254B');
  const hoverBackgroundColor = useColorModeValue('gray.50', '#262f49');

  // Implicit/token flow — popup based, so no redirect URI needs registering.
  const startLogin = useGoogleLogin({
    scope: 'openid email profile',
    prompt: 'consent',
    onSuccess,
    onError,
  });

  return (
    <Button
      onClick={() => startLogin()}
      w="100%"
      h="50px"
      minH="11"
      cursor="pointer"
      fontSize="sm"
      fontWeight="600"
      borderRadius="16px"
      bg={backgroundColor}
      color={textColor}
      border="1px solid"
      borderColor={borderColor}
      isLoading={isLoading}
      loadingText={loadingText}
      leftIcon={isLoading ? undefined : <GoogleMark />}
      _hover={{
        bg: hoverBackgroundColor,
        borderColor: '#4285F4',
        boxShadow: '0 0 0 1px #4285F4',
      }}
    >
      {label}
    </Button>
  );
};

/**
 * `useGoogleLogin` initialises Google's token client on mount and throws when no
 * client ID is configured, so the hook must not run at all in that case. The gate
 * stays hook-free and the hook lives in the inner component.
 */
export const GoogleSignInButton = (props: GoogleSignInButtonProps) => {
  if (!isGoogleAuthEnabled) return null;
  return <GoogleSignInButtonInner {...props} />;
};
