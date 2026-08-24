import { useCallback, useEffect, useState } from 'react';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import { getCampaignTeamPage } from 'app/service/organizer/donation/campaignTeamService';
import { extractApiError } from 'app/utils/apiError';
import { TEAM_NOT_FOUND_HEADING } from './teamCopy';

interface TeamPageState {
  team: CampaignTeamPage | null;
  isLoading: boolean;
  loadError: string | null;
  /** Lets an action that already returned the new team state replace it without a second read. */
  applyTeam: (updated: CampaignTeamPage) => void;
  reload: () => void;
}

/**
 * Owns the one public read behind a team page. A team that has been closed by its last member leaving
 * answers "not found", which the screen renders as a designed surface rather than an error.
 */
export function useTeamPage(
  campaignSlug: string | undefined,
  teamSlug: string | undefined,
): TeamPageState {
  const [team, setTeam] = useState<CampaignTeamPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const applyTeam = useCallback((updated: CampaignTeamPage) => {
    setTeam(updated);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!campaignSlug || !teamSlug) {
      setIsLoading(false);
      setLoadError(TEAM_NOT_FOUND_HEADING);
      return undefined;
    }

    let isActive = true;
    setIsLoading(true);

    getCampaignTeamPage(campaignSlug, teamSlug)
      .then((loaded) => {
        if (isActive) {
          setTeam(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setTeam(null);
          setLoadError(extractApiError(error, TEAM_NOT_FOUND_HEADING));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignSlug, teamSlug, reloadToken]);

  return { team, isLoading, loadError, applyTeam, reload };
}
