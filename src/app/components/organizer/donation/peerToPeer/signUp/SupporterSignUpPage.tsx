import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { MdArrowBack } from 'react-icons/md';
import { SupporterSignUpRequest } from 'app/interface/donationInter/supporterSignUpDto';
import { signUpAsSupporter } from 'app/service/organizer/donation/supporterSignUpService';
import { extractApiError } from 'app/utils/apiError';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import { signInRouteFor } from 'app/utils/session';
import { ensureAuthenticated } from 'utils/auth';
import CampaignContextBanner from '../join/CampaignContextBanner';
import {
  ALREADY_HAVE_AN_ACCOUNT,
  GO_TO_SIGN_IN,
  SIGN_IN_INSTEAD,
  SIGN_UP_DONE_HEADING,
  SIGN_UP_HEADING,
  SIGN_UP_INTRO,
} from './signUpCopy';
import SupporterSignUpForm from './SupporterSignUpForm';
import { useSupporterSignUpForm } from './useSupporterSignUpForm';

/**
 * Creating a supporter account from a campaign. The organiser sign-up form is not this: it asks for
 * an organisation and provisions the account as an organiser, which is the wrong account for someone
 * who arrived to fundraise.
 */
export const SupporterSignUpPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const navigate = useNavigate();
  const joinPath = fundraiserJoinPath(campaignUniqueId ?? '');
  const signInPath = signInRouteFor(joinPath);
  const isSignedIn = ensureAuthenticated();

  const form = useSupporterSignUpForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  useEffect(() => {
    // Someone already holding a session has nothing to create here, and sending them back to the
    // join screen is what they came for.
    if (isSignedIn) {
      navigate(joinPath, { replace: true });
    }
  }, [isSignedIn, joinPath, navigate]);

  const handleSubmit = async (request: SupporterSignUpRequest) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      setCompletedMessage(await signUpAsSupporter(campaignUniqueId ?? '', request));
    } catch (error) {
      setSubmitError(extractApiError(error, 'Your account could not be created.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box maxW="820px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
      <Stack gap={4}>
        <Flex align={{ base: 'stretch', md: 'center' }} gap={3} wrap="wrap">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<MdArrowBack />}
            minH="44px"
            alignSelf={{ base: 'flex-start', md: 'center' }}
            onClick={() => navigate(-1)}
            sx={{ cursor: 'pointer' }}
          >
            Back
          </Button>
          <Heading as="h1" fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }} minW={0}>
            {SIGN_UP_HEADING}
          </Heading>
        </Flex>

        <CampaignContextBanner
          campaignUniqueId={campaignUniqueId ?? null}
          action="Create an account"
          afterwardsNote="You will sign in next, then come straight back here."
        />

        {completedMessage ? (
          <Stack gap={4}>
            <Alert status="success" borderRadius="12px" alignItems="flex-start">
              <AlertIcon />
              <Box flex="1">
                <Text fontWeight="600">{SIGN_UP_DONE_HEADING}</Text>
                <Text fontSize="sm" mt={1}>
                  {completedMessage}
                </Text>
              </Box>
            </Alert>
            <Button
              colorScheme="brand"
              minH="44px"
              w={{ base: 'full', md: 'auto' }}
              alignSelf={{ base: 'stretch', md: 'flex-start' }}
              onClick={() => navigate(signInPath)}
              sx={{ cursor: 'pointer' }}
            >
              {GO_TO_SIGN_IN}
            </Button>
          </Stack>
        ) : (
          <Stack gap={5}>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="secondaryGray.600">
              {SIGN_UP_INTRO}
            </Text>

            {submitError && (
              <Alert status="error" borderRadius="12px" role="alert">
                <AlertIcon />
                <Text fontSize="sm">{submitError}</Text>
              </Alert>
            )}

            <SupporterSignUpForm
              form={form}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />

            <Text fontSize="sm" color="secondaryGray.600">
              {ALREADY_HAVE_AN_ACCOUNT}{' '}
              <Link as={RouterLink} to={signInPath} color="brand.500" fontWeight="600">
                {SIGN_IN_INSTEAD}
              </Link>
            </Text>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default SupporterSignUpPage;
