import { useParams } from 'react-router-dom';
import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { MdCardGiftcard, MdEmojiEvents, MdGroups } from 'react-icons/md';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import PublicPageShell from '../page/PublicPageShell';
import LeaderboardSkeleton from './LeaderboardSkeleton';
import LeaderboardSummary from './LeaderboardSummary';
import StandingsBoard from './StandingsBoard';
import StandingsEmptyState from './StandingsEmptyState';
import TopGiftsBoard from './TopGiftsBoard';
import {
  CAPPED_NOTICE,
  DONORS_COLUMN,
  FUNDRAISERS_EMPTY_GUIDANCE,
  FUNDRAISERS_EMPTY_HEADING,
  FUNDRAISERS_TAB,
  GIFTS_EMPTY_GUIDANCE,
  GIFTS_EMPTY_HEADING,
  GIFTS_TAB,
  MEMBERS_COLUMN,
  NOT_FOUND_GUIDANCE,
  NOT_FOUND_HEADING,
  RETRY_LABEL,
  TEAMS_EMPTY_GUIDANCE,
  TEAMS_EMPTY_HEADING,
  TEAMS_OFF_GUIDANCE,
  TEAMS_OFF_HEADING,
  TEAMS_TAB,
  TEAM_COLUMN,
} from './leaderboardCopy';
import { toFundraiserStandings, toTeamStandings } from './standings';
import { useLeaderboard } from './useLeaderboard';

const CappedNotice = ({ shown, total }: { shown: number; total: number }) =>
  total > shown ? (
    <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
      {CAPPED_NOTICE(shown, total)}
    </Text>
  ) : null;

/**
 * Screen 06. Composition only. Every state a reader can land in - loading, a board that is not there,
 * a campaign with nobody fundraising yet, one that never used teams, and one with no donations - is a
 * designed surface rather than an empty area.
 */
export const LeaderboardPage = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const { board, isLoading, loadError, reload } = useLeaderboard(campaignSlug);

  if (isLoading) {
    return (
      <PublicPageShell>
        <LeaderboardSkeleton />
      </PublicPageShell>
    );
  }

  if (loadError || !board) {
    return (
      <PublicPageShell>
        <FundraiserPageNotice
          heading={NOT_FOUND_HEADING}
          message={NOT_FOUND_GUIDANCE}
          onRetry={reload}
          retryLabel={RETRY_LABEL}
        />
      </PublicPageShell>
    );
  }

  const fundraisers = toFundraiserStandings(board.campaignSlug, board.fundraisers);
  const teams = toTeamStandings(board.campaignSlug, board.teams);

  return (
    <PublicPageShell>
      <Stack gap={{ base: 4, md: 6 }}>
        <LeaderboardSummary board={board} />

        <Tabs colorScheme="brand" isLazy>
          <TabList overflowX="auto" overflowY="hidden">
            <Tab minH="44px" sx={{ cursor: 'pointer' }}>
              {FUNDRAISERS_TAB}
            </Tab>
            <Tab minH="44px" sx={{ cursor: 'pointer' }}>
              {TEAMS_TAB}
            </Tab>
            <Tab minH="44px" sx={{ cursor: 'pointer' }}>
              {GIFTS_TAB}
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {fundraisers.length ? (
                <Stack gap={3}>
                  <StandingsBoard
                    standings={fundraisers}
                    currencySymbol={board.currencySymbol}
                    countColumn={DONORS_COLUMN}
                    detailColumn={TEAM_COLUMN}
                  />
                  <CappedNotice shown={fundraisers.length} total={board.fundraiserCount} />
                </Stack>
              ) : (
                <StandingsEmptyState
                  icon={MdEmojiEvents}
                  heading={FUNDRAISERS_EMPTY_HEADING}
                  guidance={FUNDRAISERS_EMPTY_GUIDANCE}
                />
              )}
            </TabPanel>

            {/* Switching teams off stops new ones forming; it does not make the ones already there
                disappear, so they stay ranked and only a campaign with none says it is not using them. */}
            <TabPanel px={0}>
              {teams.length ? (
                <Stack gap={3}>
                  <StandingsBoard
                    standings={teams}
                    currencySymbol={board.currencySymbol}
                    countColumn={MEMBERS_COLUMN}
                  />
                  <CappedNotice shown={teams.length} total={board.teamCount} />
                </Stack>
              ) : (
                <StandingsEmptyState
                  icon={MdGroups}
                  heading={board.areTeamsAllowed ? TEAMS_EMPTY_HEADING : TEAMS_OFF_HEADING}
                  guidance={board.areTeamsAllowed ? TEAMS_EMPTY_GUIDANCE : TEAMS_OFF_GUIDANCE}
                />
              )}
            </TabPanel>

            <TabPanel px={0}>
              {board.topGifts.length ? (
                <TopGiftsBoard gifts={board.topGifts} currencySymbol={board.currencySymbol} />
              ) : (
                <StandingsEmptyState
                  icon={MdCardGiftcard}
                  heading={GIFTS_EMPTY_HEADING}
                  guidance={GIFTS_EMPTY_GUIDANCE}
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </PublicPageShell>
  );
};

export default LeaderboardPage;
