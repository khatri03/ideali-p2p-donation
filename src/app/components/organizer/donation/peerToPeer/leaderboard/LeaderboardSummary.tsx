import { Alert, AlertIcon, Box, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { PeerToPeerLeaderboard } from 'app/interface/donationInter/peerToPeerLeaderboardDto';
import { formatMoney } from '../page/money';
import {
  CAMPAIGN_CLOSED_NOTICE,
  FUNDRAISER_COUNT_LABEL,
  LEADERBOARD_HEADING,
  ORGANIZER_ONLY_NOTICE,
  RAISED_BY_SUPPORTERS,
  RAISED_IN_TOTAL,
  TEAM_COUNT_LABEL,
  leaderboardSubtitle,
} from './leaderboardCopy';

interface LeaderboardSummaryProps {
  board: PeerToPeerLeaderboard;
}

const Figure = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Text fontSize="xs" textTransform="uppercase" color="gray.600" _dark={{ color: 'gray.300' }} letterSpacing="wide">
      {label}
    </Text>
    <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color="navy.700" _dark={{ color: 'white' }}>
      {value}
    </Text>
  </Box>
);

/**
 * The head of the board: whose campaign it is, what it has raised, and the two things a reader has to
 * be told rather than left to infer - that a board is unpublished, and that a race is already over.
 */
export const LeaderboardSummary = ({ board }: LeaderboardSummaryProps) => (
  <Stack gap={{ base: 3, md: 4 }}>
    <Box>
      <Heading
        as="h1"
        fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
        color="navy.700"
        _dark={{ color: 'white' }}
      >
        {LEADERBOARD_HEADING}
      </Heading>
      <Text mt={1} fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
        {leaderboardSubtitle(board.campaignName, board.organizerName)}
      </Text>
    </Box>

    {board.isOrganizerOnly && (
      <Alert status="info" borderRadius="12px" fontSize={{ base: 'sm', md: 'md' }}>
        <AlertIcon />
        {ORGANIZER_ONLY_NOTICE}
      </Alert>
    )}

    {board.isCampaignClosed && (
      <Alert status="warning" borderRadius="12px" fontSize={{ base: 'sm', md: 'md' }}>
        <AlertIcon />
        {CAMPAIGN_CLOSED_NOTICE}
      </Alert>
    )}

    <SimpleGrid
      columns={{ base: 2, md: 4 }}
      gap={{ base: 3, md: 5 }}
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
    >
      <Figure
        label={RAISED_BY_SUPPORTERS}
        value={formatMoney(board.fundraiserRaisedAmount, board.currencySymbol)}
      />
      <Figure
        label={RAISED_IN_TOTAL}
        value={formatMoney(board.campaignRaisedAmount, board.currencySymbol)}
      />
      <Figure label={FUNDRAISER_COUNT_LABEL} value={String(board.fundraiserCount)} />
      <Figure label={TEAM_COUNT_LABEL} value={String(board.teamCount)} />
    </SimpleGrid>
  </Stack>
);

export default LeaderboardSummary;
