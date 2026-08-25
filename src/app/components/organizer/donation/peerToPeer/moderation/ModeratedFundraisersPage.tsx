import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, useToast } from '@chakra-ui/react';
import { getModeratedFundraisers } from 'app/service/organizer/donation/peerToPeerModerationService';
import { ModeratedFundraiser } from 'app/interface/donationInter/peerToPeerModerationDto';
import {
  EXPORT_DONE,
  FUNDRAISERS_TAB,
  PAGES_EMPTY_BODY,
  PAGES_EMPTY_HEADING,
  PAGES_FILTERED_EMPTY_BODY,
  PAGES_FILTERED_EMPTY_HEADING,
  SEARCH_PAGES_LABEL,
} from './moderationCopy';
import { exportFundraisers } from './moderationExport';
import ModerationFilters from './ModerationFilters';
import ModerationPagination from './ModerationPagination';
import ModerationShell from './ModerationShell';
import { ModerationEmptyState, ModerationError, ModerationSkeleton } from './ModerationStates';
import FundraiserResults from './FundraiserResults';
import TwoTotalsPanel from './TwoTotalsPanel';
import { useModerationList } from './useModerationList';

/**
 * Screen 10. Every supporter page on one campaign, with the two totals above it and the way into each
 * page's own review screen. Reading only - a decision is taken on the page it applies to, where the
 * charity can see what they are deciding about.
 */
export const ModeratedFundraisersPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const toast = useToast();
  const campaignId = campaignUniqueId ?? '';

  const read = useCallback(getModeratedFundraisers, []);

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
  } = useModerationList<ModeratedFundraiser>(campaignId, read);

  const rows = result?.page.pageData ?? [];

  const handleExport = () => {
    if (!result || rows.length === 0) {
      return;
    }

    exportFundraisers(result.totals.campaignName, rows);
    toast({ title: EXPORT_DONE, status: 'success', duration: 3000, isClosable: true });
  };

  return (
    <ModerationShell
      campaignUniqueId={campaignId}
      campaignName={result?.totals.campaignName}
      heading={FUNDRAISERS_TAB}
    >
      <Stack gap={{ base: 4, md: 5 }}>
        {error && <ModerationError message={error} onRetry={reload} />}

        {isLoading && !result && <ModerationSkeleton />}

        {result && (
          <>
            <TwoTotalsPanel totals={result.totals} />

            <ModerationFilters
              searchLabel={SEARCH_PAGES_LABEL}
              filters={filters}
              isFiltered={isFiltered}
              variant="fundraisers"
              isExportDisabled={rows.length === 0}
              onChange={setFilters}
              onClear={clearFilters}
              onExport={handleExport}
            />

            {rows.length === 0 ? (
              <ModerationEmptyState
                heading={isFiltered ? PAGES_FILTERED_EMPTY_HEADING : PAGES_EMPTY_HEADING}
                body={isFiltered ? PAGES_FILTERED_EMPTY_BODY : PAGES_EMPTY_BODY}
              />
            ) : (
              <>
                <FundraiserResults
                  campaignUniqueId={campaignId}
                  currencySymbol={result.totals.currencySymbol}
                  fundraisers={rows}
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

export default ModeratedFundraisersPage;
