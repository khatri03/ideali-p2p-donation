import { useEffect, useState } from 'react';
import {
  LeaderboardVisibility,
  PeerToPeerSettings,
  PeerToPeerSettingsDetail,
} from 'app/interface/donationInter/peerToPeerDto';

export interface PeerToPeerSettingsFormState {
  isEnabled: boolean;
  goalInput: string;
  allowTeams: boolean;
  requiresApproval: boolean;
  leaderboardVisibility: LeaderboardVisibility;
  goalError: string | null;
  isSwitchLocked: boolean;
  areDetailsLocked: boolean;
  setIsEnabled: (isEnabled: boolean) => void;
  setGoalInput: (goal: string) => void;
  setAllowTeams: (allowTeams: boolean) => void;
  setRequiresApproval: (requiresApproval: boolean) => void;
  setLeaderboardVisibility: (visibility: LeaderboardVisibility) => void;
  validate: () => boolean;
  buildValues: () => PeerToPeerSettings;
  isSwitchingOff: () => boolean;
}

const toGoalInput = (goal: number | null) => (goal === null ? '' : String(goal));

/**
 * Holds the editable copy of one campaign's peer-to-peer settings plus its validation, so the
 * settings page and the campaign wizard step share identical rules instead of each writing their own.
 */
export function usePeerToPeerSettingsForm(
  settings: PeerToPeerSettingsDetail,
  isSaving: boolean,
): PeerToPeerSettingsFormState {
  const [isEnabled, setIsEnabled] = useState(settings.isPeerToPeerEnabled);
  const [goalInput, setGoalInput] = useState(toGoalInput(settings.defaultPersonalGoal));
  const [allowTeams, setAllowTeams] = useState(settings.allowTeams);
  const [requiresApproval, setRequiresApproval] = useState(settings.requiresApproval);
  const [leaderboardVisibility, setLeaderboardVisibility] = useState(settings.leaderboardVisibility);
  const [goalError, setGoalError] = useState<string | null>(null);

  useEffect(() => {
    setIsEnabled(settings.isPeerToPeerEnabled);
    setGoalInput(toGoalInput(settings.defaultPersonalGoal));
    setAllowTeams(settings.allowTeams);
    setRequiresApproval(settings.requiresApproval);
    setLeaderboardVisibility(settings.leaderboardVisibility);
    setGoalError(null);
  }, [settings]);

  const validate = (): boolean => {
    if (goalInput.trim() === '') {
      setGoalError(null);
      return true;
    }

    const goal = Number(goalInput);

    if (!Number.isFinite(goal) || goal <= 0) {
      setGoalError('Enter an amount greater than zero, or leave this blank.');
      return false;
    }

    setGoalError(null);
    return true;
  };

  const buildValues = (): PeerToPeerSettings => ({
    isPeerToPeerEnabled: isEnabled,
    defaultPersonalGoal: goalInput.trim() === '' ? null : Number(goalInput),
    allowTeams,
    requiresApproval,
    leaderboardVisibility,
  });

  return {
    isEnabled,
    goalInput,
    allowTeams,
    requiresApproval,
    leaderboardVisibility,
    goalError,
    isSwitchLocked: !settings.canEnable && !settings.isPeerToPeerEnabled,
    areDetailsLocked: !isEnabled || isSaving,
    setIsEnabled,
    setGoalInput,
    setAllowTeams,
    setRequiresApproval,
    setLeaderboardVisibility,
    validate,
    buildValues,
    isSwitchingOff: () => settings.isPeerToPeerEnabled && !isEnabled,
  };
}
