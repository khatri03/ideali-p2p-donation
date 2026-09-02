import { useCallback, useEffect, useState } from 'react';
import { CampaignTeamSummary } from 'app/interface/donationInter/campaignTeamDto';
import { getCampaignTeams } from 'app/service/organizer/donation/campaignTeamService';
import { extractApiError } from 'app/utils/apiError';
import { TEAM_PICKER_LOAD_FAILED } from './joinCopy';

interface JoinableTeamsState {
  teams: CampaignTeamSummary[];
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
}

/**
 * The teams a supporter may pick from while setting their page up. Separate from the browse screen's
 * own read because the question is different: browsing asks what is on this campaign, and this asks
 * what this form may offer. A campaign that does not use teams is never asked at all, so switching
 * teams off cannot surface as an error on a screen that was not going to show the question anyway.
 */
export function useJoinableTeams(
  campaignSlug: string | null,
  isEnabled: boolean,
): JoinableTeamsState {
  const [teams, setTeams] = useState<CampaignTeamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!isEnabled || !campaignSlug) {
      setTeams([]);
      setIsLoading(false);
      setLoadError(null);

      return undefined;
    }

    let isActive = true;
    setIsLoading(true);

    getCampaignTeams(campaignSlug)
      .then((browse) => {
        if (isActive) {
          setTeams(browse.teams);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(extractApiError(error, TEAM_PICKER_LOAD_FAILED));
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
  }, [campaignSlug, isEnabled, reloadToken]);

  return { teams, isLoading, loadError, reload };
}

export default useJoinableTeams;
