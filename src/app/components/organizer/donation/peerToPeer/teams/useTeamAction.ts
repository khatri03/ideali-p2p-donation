import { useCallback, useState } from 'react';
import { extractApiError } from 'app/utils/apiError';

interface TeamAction {
  isBusy: boolean;
  actionError: string | null;
  clearActionError: () => void;
  /** Resolves to null when the call was refused, so a caller never navigates off a failure. */
  run: <T>(work: () => Promise<T>, fallback: string) => Promise<T | null>;
}

/**
 * Runs one team write at a time and holds the two things every screen needs around it: whether it is
 * in flight, and the one sentence to show if the server refused. A refusal here is expected rather than
 * exceptional - a member calling a captain action is turned away by design - so it is surfaced, never
 * swallowed and never left as an unhandled rejection.
 */
export function useTeamAction(): TeamAction {
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const clearActionError = useCallback(() => setActionError(null), []);

  const run = useCallback(async <T,>(work: () => Promise<T>, fallback: string) => {
    setIsBusy(true);
    setActionError(null);

    try {
      return await work();
    } catch (error: unknown) {
      setActionError(extractApiError(error, fallback));
      return null;
    } finally {
      setIsBusy(false);
    }
  }, []);

  return { isBusy, actionError, clearActionError, run };
}
