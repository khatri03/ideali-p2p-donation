import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, useToast } from '@chakra-ui/react';
import { getModeratedTeams } from 'app/service/organizer/donation/peerToPeerModerationService';
import { ModeratedTeam } from 'app/interface/donationInter/peerToPeerModerationDto';
import {
  EXPORT_DONE,
  SEARCH_TEAMS_LABEL,
  TEAMS_EMPTY_BODY,
  TEAMS_EMPTY_HEADING,
  TEAMS_FILTERED_EMPTY_BODY,
  TEAMS_FILTERED_EMPTY_HEADING,
  TEAMS_TAB,
} from './moderationCopy';
import { exportTeams } from './moderationExport';
import ModerationFilters from './ModerationFilters';
import ModerationPagination from './ModerationPagination';
import ModerationShell from './ModerationShell';
import { ModerationEmptyState, ModerationError, ModerationSkeleton } from './ModerationStates';
import TeamResults from './TeamResults';
import TwoTotalsPanel from './TwoTotalsPanel';
import { useModerationList } from './useModerationList';

/**
 * Screen 16. Every team on one campaign, hidden ones included, because this is the only surface that
 * can bring a hidden team back.
 */
export const ModeratedTeamsPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const toast = useToast();
  const campaignId = campaignUniqueId ?? '';

  const read = useCallback(getModeratedTeams, []);

  const {
    result,
    isLoading,
    error,
    filters,
    isFiltered,
    setPage,
    setFilters,
    clearFilters,
    reload,
  } = useModerationList<ModeratedTeam>(campaignId, read);

  const rows = result?.page.pageData ?? [];

  const handleExport = () => {
    if (!result || rows.length === 0) {
      return;
    }

    exportTeams(result.totals.campaignName, rows);
    toast({ title: EXPORT_DONE, status: 'success', duration: 3000, isClosable: true });
  };

  return (
    <ModerationShell
      campaignUniqueId={campaignId}
      campaignName={result?.totals.campaignName}
      heading={TEAMS_TAB}
    >
      <Stack gap={{ base: 4, md: 5 }}>
        {error && <ModerationError message={error} onRetry={reload} />}

        {isLoading && !result && <ModerationSkeleton />}

        {result && (
          <>
            <TwoTotalsPanel totals={result.totals} />

            <ModerationFilters
              searchLabel={SEARCH_TEAMS_LABEL}
              filters={filters}
              isFiltered={isFiltered}
              variant="teams"
              isExportDisabled={rows.length === 0}
              onChange={setFilters}
              onClear={clearFilters}
              onExport={handleExport}
            />

            {rows.length === 0 ? (
              <ModerationEmptyState
                heading={isFiltered ? TEAMS_FILTERED_EMPTY_HEADING : TEAMS_EMPTY_HEADING}
                body={isFiltered ? TEAMS_FILTERED_EMPTY_BODY : TEAMS_EMPTY_BODY}
              />
            ) : (
              <>
                <TeamResults
                  campaignUniqueId={campaignId}
                  currencySymbol={result.totals.currencySymbol}
                  teams={rows}
                />
                <ModerationPagination
                  pageNo={result.page.pageNo}
                  pageSize={result.page.pageSize}
                  pageCount={result.page.pageCount}
                  totalRecordsCount={result.page.totalRecordsCount}
                  onChange={setPage}
                />
              </>
            )}
          </>
        )}
      </Stack>
    </ModerationShell>
  );
};

export default ModeratedTeamsPage;
