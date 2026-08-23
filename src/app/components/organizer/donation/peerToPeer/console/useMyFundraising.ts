import { useCallback, useEffect, useState } from 'react';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { getMyFundraisingPages } from 'app/service/organizer/donation/fundraiserConsoleService';
import { extractApiError } from 'app/utils/apiError';
import { LOAD_FAILED_MESSAGE } from './consoleCopy';

interface MyFundraisingState {
  pages: MyFundraisingPage[];
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
}

/**
 * Owns the one read behind the console so the screen stays a composition of presentational pieces and
 * a failure has a single place to be handled.
 */
export function useMyFundraising(): MyFundraisingState {
  const [pages, setPages] = useState<MyFundraisingPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    getMyFundraisingPages()
      .then((loaded) => {
        if (isActive) {
          setPages(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setPages([]);
          setLoadError(extractApiError(error, LOAD_FAILED_MESSAGE));
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
  }, [reloadToken]);

  return { pages, isLoading, loadError, reload };
}
