import { useCallback, useState } from 'react';
import { ModerationAction } from 'app/interface/donationInter/peerToPeerModerationDto';
import { REASON_LIMIT, REASON_TOO_LONG } from './moderationCopy';

export interface PendingModeration {
  action: ModerationAction;
  subjectUniqueId: string;
  subjectName: string;
}

interface ModerationActionState {
  pending: PendingModeration | null;
  isSaving: boolean;
  reason: string;
  reasonError: string | null;
  ask: (pending: PendingModeration) => void;
  setReason: (reason: string) => void;
  cancel: () => void;
  confirm: () => Promise<string | null>;
}

/**
 * The one path every decision goes through: ask, confirm, send, and only then tell the caller to reload.
 * The confirmation is held up until the server answers, so a charity can never be looking at a closed
 * dialog while the change is still in flight.
 */
export const useModerationAction = (
  send: (subjectUniqueId: string, action: ModerationAction, reason?: string) => Promise<void>,
): ModerationActionState => {
  const [pending, setPending] = useState<PendingModeration | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reason, setReasonState] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const ask = useCallback((next: PendingModeration) => {
    setPending(next);
    setReasonState('');
    setReasonError(null);
  }, []);

  const setReason = useCallback((next: string) => {
    setReasonState(next);
    setReasonError(next.length > REASON_LIMIT ? REASON_TOO_LONG : null);
  }, []);

  const cancel = useCallback(() => {
    if (isSaving) {
      return;
    }

    setPending(null);
    setReasonState('');
    setReasonError(null);
  }, [isSaving]);

  const confirm = useCallback(async (): Promise<string | null> => {
    if (!pending || isSaving) {
      return null;
    }

    if (reason.length > REASON_LIMIT) {
      setReasonError(REASON_TOO_LONG);
      return REASON_TOO_LONG;
    }

    setIsSaving(true);

    try {
      await send(pending.subjectUniqueId, pending.action, reason.trim() || undefined);
      setPending(null);
      setReasonState('');
      return null;
    } catch (failure: unknown) {
      return failure instanceof Error ? failure.message : 'That change could not be saved.';
    } finally {
      setIsSaving(false);
    }
  }, [pending, isSaving, reason, send]);

  return { pending, isSaving, reason, reasonError, ask, setReason, cancel, confirm };
};
