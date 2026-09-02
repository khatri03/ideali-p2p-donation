import { Alert, AlertIcon, Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { MdCheckCircle, MdOpenInNew } from 'react-icons/md';
import Card from 'themeComponents/card/Card';
import { FundraiserJoinResult } from 'app/interface/donationInter/fundraiserJoinDto';
import SharePanel from '../page/SharePanel';
import {
  GO_TO_CONSOLE,
  NEXT_SIGN_IN_NOTICE,
  PENDING_ADDRESS_NOTE,
  SIGN_OUT_AND_BACK_IN,
  TEAM_GO_TO_TEAM,
  pageAddressLabel,
  successHeading,
  successMessage,
  teamJoinedNotice,
} from './joinCopy';

interface FundraiserJoinSuccessProps {
  result: FundraiserJoinResult;
  onGoToConsole: () => void;
  onSignOutAndBackIn: () => void;
  /** Where the team the page was put into lives, so the supporter is never left to go and find it. */
  onGoToTeam: (campaignSlug: string | null, teamSlug: string) => void;
}

/** The public address of a fundraiser page, as agreed: /campaigns/{campaign}/{fundraiser}. */
export const fundraiserPageAddress = (campaignSlug: string | null, slug: string): string =>
  campaignSlug ? `/campaigns/${campaignSlug}/${slug}` : `/campaigns/${slug}`;

/**
 * What a supporter is shown the moment their page exists.
 *
 * A page still waiting on the charity is given its address to read but no control to copy it: the
 * address answers nothing until it is approved, and a supporter who sends it now sends their friends
 * to a screen saying the page is not ready. Once the page is live the same panel the rest of the
 * product shares takes over, so sharing works identically wherever it is offered.
 *
 * Signing out is not the action this screen leads with. The console is reachable immediately - only
 * the menu item waits for the next sign-in - so the supporter is taken to their page, and signing out
 * is offered beside the notice that actually explains what it fixes.
 */
export const FundraiserJoinSuccess = ({
  result,
  onGoToConsole,
  onSignOutAndBackIn,
  onGoToTeam,
}: FundraiserJoinSuccessProps) => {
  const address = fundraiserPageAddress(result.campaignSlug, result.slug);
  const shareUrl = `${window.location.origin}${address}`;
  const isWaitingForApproval = result.currentStatus === 'PendingApproval';

  return (
    <Card p={{ base: 4, md: 6 }}>
      <Stack gap={5}>
        <Stack direction="row" align="center" gap={3}>
          <Box as={MdCheckCircle} color="green.500" fontSize="28px" aria-hidden="true" />
          <Heading as="h2" fontSize={{ base: 'lg', md: 'xl' }}>
            {successHeading(result.currentStatus, result.alreadyJoined)}
          </Heading>
        </Stack>

        <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
          {successMessage(result.currentStatus, result.alreadyJoined)}
        </Text>

        {isWaitingForApproval ? (
          <Stack
            gap={2}
            bg="secondaryGray.300"
            _dark={{ bg: 'whiteAlpha.100' }}
            borderRadius="14px"
            p={4}
          >
            <Text fontSize="sm" fontWeight="600">
              {pageAddressLabel(result.currentStatus)}
            </Text>

            <Box
              bg="gray.50"
              _dark={{ bg: 'navy.800' }}
              borderRadius="10px"
              px={3}
              py={2}
              overflowX="auto"
            >
              <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.200' }} whiteSpace="nowrap">
                {shareUrl}
              </Text>
            </Box>

            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              {PENDING_ADDRESS_NOTE}
            </Text>
          </Stack>
        ) : (
          <SharePanel shareUrl={shareUrl} headingLevel="h3" isNested />
        )}

        {result.teamSlug && result.teamName && (
          <Stack
            gap={3}
            bg="secondaryGray.300"
            _dark={{ bg: 'whiteAlpha.100' }}
            borderRadius="14px"
            p={4}
          >
            <Text fontSize="sm">{teamJoinedNotice(result.teamName)}</Text>
            <Button
              variant="outline"
              size="sm"
              minH="44px"
              alignSelf={{ base: 'stretch', md: 'flex-start' }}
              onClick={() => onGoToTeam(result.campaignSlug, result.teamSlug!)}
              sx={{ cursor: 'pointer' }}
            >
              {TEAM_GO_TO_TEAM}
            </Button>
          </Stack>
        )}

        <Button
          colorScheme="brand"
          minH="44px"
          rightIcon={<MdOpenInNew />}
          w={{ base: 'full', md: 'auto' }}
          alignSelf={{ base: 'stretch', md: 'flex-start' }}
          onClick={onGoToConsole}
          sx={{ cursor: 'pointer' }}
        >
          {GO_TO_CONSOLE}
        </Button>

        <Alert status="info" borderRadius="12px" alignItems="flex-start">
          <AlertIcon />
          <Stack gap={2} flex="1" minW={0}>
            <Text fontSize="sm">{NEXT_SIGN_IN_NOTICE}</Text>
            <Button
              variant="link"
              size="sm"
              colorScheme="brand"
              alignSelf="flex-start"
              minH="44px"
              onClick={onSignOutAndBackIn}
              sx={{ cursor: 'pointer' }}
            >
              {SIGN_OUT_AND_BACK_IN}
            </Button>
          </Stack>
        </Alert>
      </Stack>
    </Card>
  );
};

export default FundraiserJoinSuccess;
