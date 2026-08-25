import { useCallback, useEffect, useState } from 'react';
import { PeerToPeerLeaderboard } from 'app/interface/donationInter/peerToPeerLeaderboardDto';
import { getLeaderboard } from 'app/service/organizer/donation/peerToPeerLeaderboardService';
import { extractApiError } from 'app/utils/apiError';
import { NOT_FOUND_MESSAGE } from './leaderboardCopy';

interface LeaderboardState {
  board: PeerToPeerLeaderboard | null;
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
}

/**
 * Owns the one public read behind the standings, so the screen stays a composition of presentational
 * pieces and there is a single place a failure can be handled.
 */
export function useLeaderboard(campaignSlug: string | undefined): LeaderboardState {
  const [board, setBoard] = useState<PeerToPeerLeaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!campaignSlug) {
      setIsLoading(false);
      setLoadError(NOT_FOUND_MESSAGE);
      return undefined;
    }

    let isActive = true;
    setIsLoading(true);

    getLeaderboard(campaignSlug)
      .then((loaded) => {
        if (isActive) {
          setBoard(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setBoard(null);
          setLoadError(extractApiError(error, NOT_FOUND_MESSAGE));
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
  }, [campaignSlug, reloadToken]);

  return { board, isLoading, loadError, reload };
}
