import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Skeleton,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  InvitationAcceptResult,
  InvitationLanding,
} from 'app/interface/donationInter/fundraiserInvitationDto';
import {
  acceptInvitation,
  openInvitation,
} from 'app/service/organizer/donation/fundraiserInvitationService';
import { extractApiError } from 'app/utils/apiError';
import { fundraiserInvitationPath } from 'app/utils/returnPath';
import { signInRouteFor } from 'app/utils/session';
import {
  ACCEPTED_AWAITING_BODY,
  ACCEPTED_AWAITING_HEADING,
  ACCEPTED_HEADING,
  ACCEPTING_LABEL,
  ACCEPT_LABEL,
  DISPLAY_NAME_LABEL,
  DISPLAY_NAME_PLACEHOLDER,
  DISPLAY_NAME_REQUIRED,
  GOAL_HELP,
  GOAL_LABEL,
  LANDING_HEADING,
  LINK_MISSING,
  LINK_REFUSED,
  SIGN_IN_PROMPT,
  STORY_LABEL,
  STORY_PLACEHOLDER,
  VIEW_PAGE_LABEL,
} from './invitationLandingCopy';

const isSignedIn = () => Boolean(localStorage.getItem('AuthToken'));

/**
 * Where an invitation link lands.
 *
 * Reading the invitation is anonymous, because the person holding the link has not signed in yet.
 * Accepting is not: it creates a fundraising page, so it needs an account, and the server checks that
 * account is the one the invitation was addressed to. A forwarded email gets somebody as far as this
 * screen and no further.
 */
export const InvitationLandingPage = () => {
  const { campaignUniqueId = '' } = useParams<{ campaignUniqueId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [landing, setLanding] = useState<InvitationLanding | null>(null);
  const [isReading, setIsReading] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [story, setStory] = useState('');
  const [goal, setGoal] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState<InvitationAcceptResult | null>(null);

  useEffect(() => {
    if (!campaignUniqueId || !token) {
      setFailure(LINK_MISSING);
      setIsReading(false);
      return undefined;
    }

    let isActive = true;
    setIsReading(true);

    openInvitation(campaignUniqueId, token)
      .then((result) => {
        if (isActive) {
          setLanding(result);
          setFailure(null);
        }
      })
      .catch((error) => {
        if (isActive) {
          setFailure(extractApiError(error, LINK_REFUSED));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsReading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignUniqueId, token]);

  const handleAccept = async () => {
    if (displayName.trim().length === 0) {
      setNameError(DISPLAY_NAME_REQUIRED);
      return;
    }

    setNameError(null);
    setIsAccepting(true);

    try {
      const parsedGoal = Number.parseFloat(goal);

      setAccepted(
        await acceptInvitation(campaignUniqueId, {
          token,
          displayName: displayName.trim(),
          story: story.trim() || undefined,
          personalGoal: Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : undefined,
        }),
      );
      setFailure(null);
    } catch (error) {
      setFailure(extractApiError(error, LINK_REFUSED));
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Box maxW="640px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 8, md: 12 }}>
      <Stack gap={5}>
        <Heading as="h1" fontSize={{ base: 'xl', md: '2xl' }}>
          {accepted
            ? accepted.isAwaitingApproval
              ? ACCEPTED_AWAITING_HEADING
              : ACCEPTED_HEADING
            : LANDING_HEADING}
        </Heading>

        {isReading && <Skeleton height="120px" borderRadius="12px" />}

        {!isReading && failure && (
          <Alert status="error" borderRadius="12px" alignItems="flex-start" role="alert">
            <AlertIcon />
            <Text fontSize="sm">{failure}</Text>
          </Alert>
        )}

        {!isReading && !failure && accepted && (
          <Stack gap={4}>
            {accepted.isAwaitingApproval && (
              <Text fontSize="sm" color="secondaryGray.600">
                {ACCEPTED_AWAITING_BODY}
              </Text>
            )}
            <Button
              as={RouterLink}
              to={`/campaigns/${accepted.campaignSlug}/${accepted.slug}`}
              colorScheme="brand"
              minH="44px"
              w={{ base: 'full', md: 'auto' }}
              sx={{ cursor: 'pointer' }}
            >
              {VIEW_PAGE_LABEL}
            </Button>
          </Stack>
        )}

        {!isReading && !failure && landing && !accepted && (
          <Stack gap={5}>
            <Stack gap={2}>
              <Text fontSize={{ base: 'sm', md: 'md' }}>
                <Text as="span" fontWeight="700">
                  {landing.organizerName}
                </Text>{' '}
                has asked you to raise money for{' '}
                <Text as="span" fontWeight="700">
                  {landing.campaignName}
                </Text>
                .
              </Text>
              {landing.personalMessage && (
                <Box
                  borderLeftWidth="4px"
                  borderColor="brand.500"
                  bg="secondaryGray.100"
                  _dark={{ bg: 'navy.700' }}
                  borderRadius="8px"
                  px={4}
                  py={3}
                >
                  <Text fontSize="sm" whiteSpace="pre-wrap">
                    {landing.personalMessage}
                  </Text>
                </Box>
              )}
            </Stack>

            {!isSignedIn() ? (
              <Button
                as={RouterLink}
                to={signInRouteFor(fundraiserInvitationPath(campaignUniqueId, token))}
                colorScheme="brand"
                minH="44px"
                w={{ base: 'full', md: 'auto' }}
                sx={{ cursor: 'pointer' }}
              >
                {SIGN_IN_PROMPT}
              </Button>
            ) : (
              <Stack gap={4}>
                <FormControl isInvalid={nameError !== null} isRequired>
                  <FormLabel fontSize="sm" htmlFor="invitation-display-name">
                    {DISPLAY_NAME_LABEL}
                  </FormLabel>
                  <Input
                    id="invitation-display-name"
                    value={displayName}
                    minH="44px"
                    maxLength={100}
                    placeholder={DISPLAY_NAME_PLACEHOLDER}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                  {nameError && <FormErrorMessage fontSize="sm">{nameError}</FormErrorMessage>}
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" htmlFor="invitation-goal">
                    {GOAL_LABEL}
                  </FormLabel>
                  <Input
                    id="invitation-goal"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={goal}
                    minH="44px"
                    onChange={(event) => setGoal(event.target.value)}
                  />
                  <FormHelperText fontSize="sm">{GOAL_HELP}</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" htmlFor="invitation-story">
                    {STORY_LABEL}
                  </FormLabel>
                  <Textarea
                    id="invitation-story"
                    value={story}
                    rows={4}
                    placeholder={STORY_PLACEHOLDER}
                    onChange={(event) => setStory(event.target.value)}
                  />
                </FormControl>

                <Button
                  colorScheme="brand"
                  minH="44px"
                  w={{ base: 'full', md: 'auto' }}
                  isDisabled={isAccepting}
                  isLoading={isAccepting}
                  loadingText={ACCEPTING_LABEL}
                  onClick={handleAccept}
                  sx={{ cursor: isAccepting ? 'not-allowed' : 'pointer' }}
                >
                  {ACCEPT_LABEL}
                </Button>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default InvitationLandingPage;
