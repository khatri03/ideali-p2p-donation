import { useCallback, useEffect, useState } from 'react';
import {
  FundraiserJoinContext,
  FundraiserJoinRequest,
  FundraiserJoinResult,
} from 'app/interface/donationInter/fundraiserJoinDto';
import {
  getFundraiserJoinContext,
  joinCampaignAsFundraiser,
} from 'app/service/organizer/donation/fundraiserJoinService';
import { extractApiError } from 'app/utils/apiError';

interface FundraiserJoinState {
  context: FundraiserJoinContext | null;
  result: FundraiserJoinResult | null;
  isLoading: boolean;
  isSubmitting: boolean;
  loadError: string | null;
  reload: () => void;
  join: (request: FundraiserJoinRequest) => Promise<string | null>;
}

/**
 * Owns the campaign lookup and the join call for one campaign, so the screen stays a composition of
 * presentational pieces and every failure path has exactly one place to live.
 */
export function useFundraiserJoin(campaignUniqueId: string): FundraiserJoinState {
  const [context, setContext] = useState<FundraiserJoinContext | null>(null);
  const [result, setResult] = useState<FundraiserJoinResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!campaignUniqueId) {
      setIsLoading(false);
      setLoadError('No campaign was selected.');
      return undefined;
    }

    let isActive = true;
    setIsLoading(true);

    getFundraiserJoinContext(campaignUniqueId)
      .then((loaded) => {
        if (isActive) {
          setContext(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(extractApiError(error, 'This campaign could not be opened.'));
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
  }, [campaignUniqueId, reloadToken]);

  const join = useCallback(
    async (request: FundraiserJoinRequest): Promise<string | null> => {
      setIsSubmitting(true);

      try {
        setResult(await joinCampaignAsFundraiser(campaignUniqueId, request));
        return null;
      } catch (error: unknown) {
        return extractApiError(error, 'Your fundraising page could not be created.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [campaignUniqueId],
  );

  return { context, result, isLoading, isSubmitting, loadError, reload, join };
}
