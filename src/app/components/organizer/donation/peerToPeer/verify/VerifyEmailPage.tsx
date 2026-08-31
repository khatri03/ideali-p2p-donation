import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, AlertIcon, Box, Button, Heading, Skeleton, Stack, Text } from '@chakra-ui/react';
import { confirmEmailAddress } from 'app/service/organizer/donation/emailVerificationService';
import { extractApiError } from 'app/utils/apiError';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import {
  VERIFY_DONE_HEADING,
  VERIFY_FAILED_HEADING,
  VERIFY_HEADING,
  VERIFY_LINK_MISSING,
  VERIFY_NEXT_STEP,
  VERIFY_REFUSED,
  VERIFY_WORKING,
} from './verifyCopy';
import PublicPageShell from '../page/PublicPageShell';

/**
 * Where the link in a confirmation email lands.
 *
 * Confirming an address is all this does. It does not sign anybody in: the link arrived by email,
 * email is forwardable, and holding one is not evidence of who is at the keyboard. The person is
 * sent on to sign in for themselves, arriving on the fundraising page they were heading for.
 */
export const VerifyEmailPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const [isVerifying, setIsVerifying] = useState(true);
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignUniqueId || !token) {
      setFailure(VERIFY_LINK_MISSING);
      setIsVerifying(false);
      return undefined;
    }

    let isActive = true;
    setIsVerifying(true);

    confirmEmailAddress(campaignUniqueId, token)
      .then((result) => {
        if (isActive) {
          setCampaignName(result.campaignName);
          setFailure(null);
        }
      })
      .catch((error) => {
        if (isActive) {
          setFailure(extractApiError(error, VERIFY_REFUSED));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsVerifying(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignUniqueId, token]);

  const joinPath = fundraiserJoinPath(campaignUniqueId ?? '');

  return (
    <PublicPageShell maxWidth="640px">
      <Stack gap={5}>
        <Heading as="h1" fontSize={{ base: 'xl', md: '2xl' }}>
          {VERIFY_HEADING}
        </Heading>

        {isVerifying && <Skeleton height="88px" borderRadius="12px" />}

        {!isVerifying && failure && (
          <Alert status="error" borderRadius="12px" alignItems="flex-start" role="alert">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="600">{VERIFY_FAILED_HEADING}</Text>
              <Text fontSize="sm" mt={1}>
                {failure}
              </Text>
            </Box>
          </Alert>
        )}

        {!isVerifying && !failure && (
          <Stack gap={4}>
            <Alert status="success" borderRadius="12px" alignItems="flex-start">
              <AlertIcon />
              <Box flex="1">
                <Text fontWeight="600">{VERIFY_DONE_HEADING}</Text>
                <Text fontSize="sm" mt={1}>
                  {campaignName
                    ? `Your address is confirmed. You can now set up your fundraising page for ${campaignName}.`
                    : 'Your address is confirmed. You can now set up your fundraising page.'}
                </Text>
              </Box>
            </Alert>

            <Button
              colorScheme="brand"
              minH="44px"
              w={{ base: 'full', md: 'auto' }}
              alignSelf={{ base: 'stretch', md: 'flex-start' }}
              onClick={() => navigate(joinPath)}
              sx={{ cursor: 'pointer' }}
            >
              {VERIFY_NEXT_STEP}
            </Button>
          </Stack>
        )}

        {isVerifying && (
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {VERIFY_WORKING}
          </Text>
        )}
      </Stack>
    </PublicPageShell>
  );
};

export default VerifyEmailPage;
