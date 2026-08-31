import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertIcon, Box, Button, Heading, Stack, Text, useToast } from '@chakra-ui/react';
import { MdArrowBack } from 'react-icons/md';
import { FundraiserJoinRequest } from 'app/interface/donationInter/fundraiserJoinDto';
import { ensureAuthenticated } from 'utils/auth';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import { signOutAndReturnTo, storedDisplayName } from 'app/utils/session';
import FundraiseAccessModal from '../access/FundraiseAccessModal';
import { JOIN_HEADING } from './joinCopy';
import PublicPageShell from '../page/PublicPageShell';
import FundraiserJoinForm from './FundraiserJoinForm';
import FundraiserJoinSkeleton from './FundraiserJoinSkeleton';
import FundraiserJoinSuccess from './FundraiserJoinSuccess';
import { myFundraisingPath } from '../console/MyFundraisingPage';
import { useFundraiserJoin } from './useFundraiserJoin';

/**
 * Screen 03. Composes the join flow: sign-in gate, campaign lookup, the form, and the state a
 * supporter lands in afterwards. Every branch is a designed surface - there is no blank case.
 */
export const FundraiserJoinPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const returnPath = fundraiserJoinPath(campaignUniqueId ?? '');
  const isSignedIn = ensureAuthenticated();

  const { context, result, isLoading, isSubmitting, loadError, reload, join } = useFundraiserJoin(
    isSignedIn ? campaignUniqueId ?? '' : '',
  );

  const handleSubmit = async (request: FundraiserJoinRequest) => {
    const failure = await join(request);

    if (failure) {
      toast({
        title: 'Not created',
        description: failure,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    }
  };

  const suggestedDisplayName = storedDisplayName();

  // A visitor who reached this page without a session - from a shared link, or from the button in a
  // confirmation email - is offered both ways in here rather than being bounced to another screen.
  if (!isSignedIn) {
    return (
      <PublicPageShell maxWidth="820px">
        <FundraiseAccessModal
          campaignUniqueId={campaignUniqueId ?? ''}
          isOpen
          onClose={() => navigate(-1)}
        />
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell maxWidth="820px">
      <Stack gap={4}>
        {/* Its own row, so the heading and the card below it share one left edge. */}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<MdArrowBack />}
          minH="44px"
          alignSelf="flex-start"
          ml={-3}
          onClick={() => navigate(-1)}
          sx={{ cursor: 'pointer' }}
        >
          Back
        </Button>

        <Stack gap={1} minW={0}>
          <Heading as="h1" fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}>
            {JOIN_HEADING}
          </Heading>
          {context?.campaignName && (
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
              Campaign:{' '}
              <Text as="span" fontWeight="600" color="secondaryGray.900" _dark={{ color: 'white' }}>
                {context.campaignName}
              </Text>
            </Text>
          )}
        </Stack>

        {loadError && (
          <Alert status="error" borderRadius="12px">
            <AlertIcon />
            <Box flex="1">
              <Text fontSize="sm">{loadError}</Text>
            </Box>
            <Button
              size="sm"
              variant="outline"
              minH="44px"
              onClick={reload}
              sx={{ cursor: 'pointer' }}
            >
              Try again
            </Button>
          </Alert>
        )}

        {isLoading && !loadError && <FundraiserJoinSkeleton />}

        {!isLoading && !loadError && context && !result && !context.canJoin && (
          <Alert status="warning" borderRadius="12px">
            <AlertIcon />
            <Text fontSize="sm">{context.blockedReason}</Text>
          </Alert>
        )}

        {!isLoading && !loadError && context && !result && context.canJoin && context.alreadyJoined && (
          <FundraiserJoinSuccess
            result={{
              slug: context.slug ?? '',
              campaignSlug: context.campaignSlug,
              currentStatus: context.currentStatus ?? 'Active',
              alreadyJoined: true,
            }}
            onGoToConsole={() => navigate(myFundraisingPath)}
            onSignOutAndBackIn={() => signOutAndReturnTo(returnPath)}
          />
        )}

        {!isLoading && !loadError && context && !result && context.canJoin && !context.alreadyJoined && (
          <FundraiserJoinForm
            context={context}
            suggestedDisplayName={suggestedDisplayName}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        )}

        {result && (
          <FundraiserJoinSuccess
            result={result}
            onGoToConsole={() => navigate(myFundraisingPath)}
            onSignOutAndBackIn={() => signOutAndReturnTo(returnPath)}
          />
        )}
      </Stack>
    </PublicPageShell>
  );
};

export default FundraiserJoinPage;
