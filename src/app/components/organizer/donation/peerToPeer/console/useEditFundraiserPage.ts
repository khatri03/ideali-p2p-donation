import { useCallback, useEffect, useState } from 'react';
import {
  FundraiserPageUpdate,
  MyFundraisingPage,
} from 'app/interface/donationInter/fundraiserConsoleDto';
import {
  getMyFundraisingPage,
  removeMyFundraisingPhoto,
  setMyFundraisingPhoto,
  updateMyFundraisingPage,
} from 'app/service/organizer/donation/fundraiserConsoleService';
import { extractApiError } from 'app/utils/apiError';
import { NOT_FOUND_GUIDANCE } from './consoleCopy';

interface EditFundraiserPageState {
  page: MyFundraisingPage | null;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  isPhotoBusy: boolean;
  saveError: string | null;
  hasSaved: boolean;
  reload: () => void;
  save: (update: FundraiserPageUpdate) => Promise<boolean>;
  setPhoto: (photo: File) => Promise<void>;
  removePhoto: () => Promise<void>;
}

/**
 * Every server call the edit screen makes, in one place: the read it opens with, the save, and the two
 * photo actions. Each one reports its own failure rather than leaving the screen guessing, and each
 * one refreshes the page it just changed because there is no cache to invalidate.
 */
export function useEditFundraiserPage(fundraiserUniqueId: string | undefined): EditFundraiserPageState {
  const [page, setPage] = useState<MyFundraisingPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!fundraiserUniqueId) {
      setIsLoading(false);
      setLoadError(NOT_FOUND_GUIDANCE);
      return undefined;
    }

    let isActive = true;
    setIsLoading(true);

    getMyFundraisingPage(fundraiserUniqueId)
      .then((loaded) => {
        if (isActive) {
          setPage(loaded);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setPage(null);
          setLoadError(extractApiError(error, NOT_FOUND_GUIDANCE));
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
  }, [fundraiserUniqueId, reloadToken]);

  const save = useCallback(
    async (update: FundraiserPageUpdate) => {
      if (!fundraiserUniqueId) {
        return false;
      }

      setIsSaving(true);
      setSaveError(null);
      setHasSaved(false);

      try {
        setPage(await updateMyFundraisingPage(fundraiserUniqueId, update));
        setHasSaved(true);

        return true;
      } catch (error: unknown) {
        setSaveError(extractApiError(error, 'Could not save your page.'));

        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [fundraiserUniqueId],
  );

  const runPhotoAction = useCallback(
    async (action: () => Promise<unknown>, failureMessage: string) => {
      if (!fundraiserUniqueId) {
        return;
      }

      setIsPhotoBusy(true);
      setSaveError(null);

      try {
        await action();
        setPage(await getMyFundraisingPage(fundraiserUniqueId));
      } catch (error: unknown) {
        setSaveError(extractApiError(error, failureMessage));
      } finally {
        setIsPhotoBusy(false);
      }
    },
    [fundraiserUniqueId],
  );

  const setPhoto = useCallback(
    (photo: File) =>
      runPhotoAction(
        () => setMyFundraisingPhoto(fundraiserUniqueId as string, photo),
        'Could not save your photo.',
      ),
    [fundraiserUniqueId, runPhotoAction],
  );

  const removePhoto = useCallback(
    () =>
      runPhotoAction(
        () => removeMyFundraisingPhoto(fundraiserUniqueId as string),
        'Could not remove your photo.',
      ),
    [fundraiserUniqueId, runPhotoAction],
  );

  return {
    page,
    isLoading,
    loadError,
    isSaving,
    isPhotoBusy,
    saveError,
    hasSaved,
    reload,
    save,
    setPhoto,
    removePhoto,
  };
}
