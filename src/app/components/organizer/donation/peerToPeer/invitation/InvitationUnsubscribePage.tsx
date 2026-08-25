import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Alert, AlertIcon, Box, Heading, Skeleton, Stack, Text } from '@chakra-ui/react';
import { unsubscribeFromInvitations } from 'app/service/organizer/donation/fundraiserInvitationService';
import { extractApiError } from 'app/utils/apiError';
import {
  LINK_MISSING,
  UNSUBSCRIBE_DONE,
  UNSUBSCRIBE_FAILED,
  UNSUBSCRIBE_HEADING,
  UNSUBSCRIBE_WORKING,
} from './invitationLandingCopy';

/**
 * The way out of these emails. Anonymous on purpose: an unsubscribe that demanded a password would
 * not be an unsubscribe, and bulk mail that is hard to leave costs deliverability for every charity
 * on the platform.
 */
export const InvitationUnsubscribePage = () => {
  const { campaignUniqueId = '' } = useParams<{ campaignUniqueId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [isWorking, setIsWorking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignUniqueId || !token) {
      setFailure(LINK_MISSING);
      setIsWorking(false);
      return undefined;
    }

    let isActive = true;
    setIsWorking(true);

    unsubscribeFromInvitations(campaignUniqueId, token)
      .then((result) => {
        if (isActive) {
          setMessage(result || UNSUBSCRIBE_DONE);
          setFailure(null);
        }
      })
      .catch((error) => {
        if (isActive) {
          setFailure(extractApiError(error, UNSUBSCRIBE_FAILED));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsWorking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignUniqueId, token]);

  return (
    <Box maxW="640px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 8, md: 12 }}>
      <Stack gap={5}>
        <Heading as="h1" fontSize={{ base: 'xl', md: '2xl' }}>
          {UNSUBSCRIBE_HEADING}
        </Heading>

        {isWorking && (
          <>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {UNSUBSCRIBE_WORKING}
            </Text>
            <Skeleton height="64px" borderRadius="12px" />
          </>
        )}

        {!isWorking && failure && (
          <Alert status="error" borderRadius="12px" alignItems="flex-start" role="alert">
            <AlertIcon />
            <Text fontSize="sm">{failure}</Text>
          </Alert>
        )}

        {!isWorking && !failure && (
          <Alert status="success" borderRadius="12px" alignItems="flex-start" role="status">
            <AlertIcon />
            <Text fontSize="sm">{message}</Text>
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default InvitationUnsubscribePage;
