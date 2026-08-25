import { useCallback, useEffect, useState } from 'react';

interface ModerationDetailState<T> {
  detail: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * One moderated page or team, read afresh after every decision rather than patched in place. The status
 * a charity sees has to be the status the server holds, not the one the screen hoped for.
 */
export const useModerationDetail = <T>(
  campaignUniqueId: string,
  subjectUniqueId: string,
  read: (campaignUniqueId: string, subjectUniqueId: string) => Promise<T>,
): ModerationDetailState<T> => {
  const [detail, setDetail] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!campaignUniqueId || !subjectUniqueId) {
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;

    setIsLoading(true);

    read(campaignUniqueId, subjectUniqueId)
      .then((next) => {
        if (isActive) {
          setDetail(next);
          setError(null);
        }
      })
      .catch((failure: unknown) => {
        if (isActive) {
          setError(failure instanceof Error ? failure.message : 'Something went wrong.');
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
  }, [campaignUniqueId, subjectUniqueId, read, reloadToken]);

  return { detail, isLoading, error, reload };
};
