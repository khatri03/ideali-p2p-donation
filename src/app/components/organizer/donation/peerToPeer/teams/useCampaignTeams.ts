import { useCallback, useEffect, useState } from 'react';
import { CampaignTeamBrowse } from 'app/interface/donationInter/campaignTeamDto';
import { getCampaignTeams } from 'app/service/organizer/donation/campaignTeamService';
import { extractApiError } from 'app/utils/apiError';
import { BROWSE_LOAD_FAILED_HEADING } from './teamCopy';

/** Long enough that typing a team name is one request, short enough to feel immediate. */
export const SEARCH_SETTLE_MS = 300;

interface CampaignTeamsState {
  browse: CampaignTeamBrowse | null;
  search: string;
  isLoading: boolean;
  isSearching: boolean;
  loadError: string | null;
  setSearch: (value: string) => void;
  reload: () => void;
}

/**
 * Owns the one read behind the browse-teams screen, including the search the server answers. The first
 * load and a later search are distinguished so a search never blanks the list back to a skeleton.
 */
export function useCampaignTeams(campaignSlug: string | undefined): CampaignTeamsState {
  const [browse, setBrowse] = useState<CampaignTeamBrowse | null>(null);
  const [search, setSearch] = useState('');
  const [settledSearch, setSettledSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (search === settledSearch) {
      return undefined;
    }

    const timer = setTimeout(() => setSettledSearch(search), SEARCH_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [search, settledSearch]);

  useEffect(() => {
    if (!campaignSlug) {
      setIsLoading(false);
      setLoadError(BROWSE_LOAD_FAILED_HEADING);
      return undefined;
    }

    let isActive = true;
    setIsSearching(true);

    getCampaignTeams(campaignSlug, settledSearch)
      .then((loaded) => {
        if (isActive) {
          setBrowse(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(extractApiError(error, BROWSE_LOAD_FAILED_HEADING));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
          setIsSearching(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignSlug, settledSearch, reloadToken]);

  return { browse, search, isLoading, isSearching, loadError, setSearch, reload };
}
