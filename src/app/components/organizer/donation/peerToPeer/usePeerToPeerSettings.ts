import { useCallback, useEffect, useState } from 'react';
import {
  PeerToPeerSettings,
  PeerToPeerSettingsDetail,
} from 'app/interface/donationInter/peerToPeerDto';
import {
  getPeerToPeerSettings,
  updatePeerToPeerSettings,
} from 'app/service/organizer/donation/peerToPeerService';
import { extractApiError } from 'app/utils/apiError';

interface PeerToPeerSettingsState {
  settings: PeerToPeerSettingsDetail | null;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  reload: () => void;
  save: (values: PeerToPeerSettings) => Promise<string | null>;
}

/**
 * Owns the fetch, the reload and the save for one campaign's peer-to-peer settings so the page can
 * stay a composition of presentational pieces.
 */
export function usePeerToPeerSettings(campaignUniqueId: string): PeerToPeerSettingsState {
  const [settings, setSettings] = useState<PeerToPeerSettingsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

    getPeerToPeerSettings(campaignUniqueId)
      .then((result) => {
        if (isActive) {
          setSettings(result);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(extractApiError(error, 'These settings could not be loaded.'));
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

  const save = useCallback(
    async (values: PeerToPeerSettings): Promise<string | null> => {
      setIsSaving(true);

      try {
        await updatePeerToPeerSettings(campaignUniqueId, values);
        const refreshed = await getPeerToPeerSettings(campaignUniqueId);
        setSettings(refreshed);
        return null;
      } catch (error: unknown) {
        return extractApiError(error, 'These settings could not be saved.');
      } finally {
        setIsSaving(false);
      }
    },
    [campaignUniqueId],
  );

  return { settings, isLoading, isSaving, loadError, reload, save };
}
