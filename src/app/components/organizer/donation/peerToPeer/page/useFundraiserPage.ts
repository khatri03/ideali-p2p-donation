import { useCallback, useEffect, useState } from 'react';
import { FundraiserPage } from 'app/interface/donationInter/fundraiserPageDto';
import { getFundraiserPage } from 'app/service/organizer/donation/fundraiserPageService';
import { extractApiError } from 'app/utils/apiError';
import { NOT_FOUND_MESSAGE } from './pageCopy';

interface FundraiserPageState {
  page: FundraiserPage | null;
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
}

/**
 * Owns the one public read behind a fundraiser page, so the screen stays a composition of
 * presentational pieces and there is a single place a failure can be handled.
 */
export function useFundraiserPage(
  campaignSlug: string | undefined,
  fundraiserSlug: string | undefined,
): FundraiserPageState {
  const [page, setPage] = useState<FundraiserPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!campaignSlug || !fundraiserSlug) {
      setIsLoading(false);
      setLoadError(NOT_FOUND_MESSAGE);
      return undefined;
    }

    let isActive = true;
    setIsLoading(true);

    getFundraiserPage(campaignSlug, fundraiserSlug)
      .then((loaded) => {
        if (isActive) {
          setPage(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setPage(null);
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
  }, [campaignSlug, fundraiserSlug, reloadToken]);

  return { page, isLoading, loadError, reload };
}
