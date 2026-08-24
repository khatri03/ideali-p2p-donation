import { useCallback, useEffect, useMemo, useState } from 'react';
import { CampaignTeamPage, CampaignTeamSave } from 'app/interface/donationInter/campaignTeamDto';
import {
  GOAL_NOT_A_NUMBER,
  GOAL_TOO_SMALL,
  NAME_REQUIRED,
  goalTooLarge,
  nameTooLong,
  storyTooLong,
} from './teamCopy';

/** The same limits CampaignTeamValidator enforces. Duplicated for the message, never trusted instead. */
export const TEAM_NAME_MAX_LENGTH = 80;
export const TEAM_STORY_MAX_LENGTH = 2000;
export const TEAM_GOAL_MAXIMUM = 10_000_000;
const GOAL_DECIMAL_PLACES = 2;

/**
 * A goal is typed one keystroke at a time, so the field keeps only what a money amount can contain:
 * digits, a single decimal point, and two places after it. A captain finds out on the keystroke rather
 * than on the save, and the field can never hold a figure the server would refuse.
 */
export const toTeamGoalInput = (typed: string): string => {
  const [whole, ...afterTheFirstPoint] = typed.replace(/[^\d.]/g, '').split('.');

  if (!afterTheFirstPoint.length) return whole;

  return `${whole || '0'}.${afterTheFirstPoint.join('').slice(0, GOAL_DECIMAL_PLACES)}`;
};

export interface TeamFormValues {
  name: string;
  /** Held as text so a half-typed number is not silently turned into something else. */
  teamGoal: string;
  story: string;
}

export type TeamFormErrors = Partial<Record<keyof TeamFormValues, string>>;

export const EMPTY_TEAM_FORM: TeamFormValues = { name: '', teamGoal: '', story: '' };

const toValues = (team: CampaignTeamPage): TeamFormValues => ({
  name: team.name,
  teamGoal: team.teamGoal === null ? '' : String(team.teamGoal),
  story: team.story ?? '',
});

export const validateTeamForm = (values: TeamFormValues): TeamFormErrors => {
  const errors: TeamFormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = NAME_REQUIRED;
  } else if (name.length > TEAM_NAME_MAX_LENGTH) {
    errors.name = nameTooLong(TEAM_NAME_MAX_LENGTH);
  }

  const goalText = values.teamGoal.trim();

  if (goalText) {
    const goal = Number(goalText);

    if (!Number.isFinite(goal)) {
      errors.teamGoal = GOAL_NOT_A_NUMBER;
    } else if (goal <= 0) {
      errors.teamGoal = GOAL_TOO_SMALL;
    } else if (goal > TEAM_GOAL_MAXIMUM) {
      errors.teamGoal = goalTooLarge(TEAM_GOAL_MAXIMUM);
    }
  }

  if (values.story.trim().length > TEAM_STORY_MAX_LENGTH) {
    errors.story = storyTooLong(TEAM_STORY_MAX_LENGTH);
  }

  return errors;
};

export const toTeamSaveRequest = (values: TeamFormValues): CampaignTeamSave => {
  const goalText = values.teamGoal.trim();
  const story = values.story.trim();

  return {
    name: values.name.trim(),
    story: story ? story : null,
    teamGoal: goalText ? Number(goalText) : null,
  };
};

interface TeamForm {
  values: TeamFormValues;
  errors: TeamFormErrors;
  hasUnsavedChanges: boolean;
  setField: (field: keyof TeamFormValues, value: string) => void;
  validate: () => TeamFormErrors;
  reset: (team: CampaignTeamPage) => void;
}

/**
 * Holds what the captain has typed, what is wrong with it, and whether anything is unsaved. Shared by
 * the create screen and the edit screen so the two forms cannot drift apart, and kept out of both so
 * each screen stays composition.
 */
export function useTeamForm(team: CampaignTeamPage | null): TeamForm {
  const [values, setValues] = useState<TeamFormValues>(EMPTY_TEAM_FORM);
  const [saved, setSaved] = useState<TeamFormValues | null>(null);
  const [errors, setErrors] = useState<TeamFormErrors>({});

  useEffect(() => {
    if (team) {
      const loaded = toValues(team);
      setValues(loaded);
      setSaved(loaded);
      setErrors({});
    }
  }, [team]);

  const setField = useCallback((field: keyof TeamFormValues, value: string) => {
    const typed = field === 'teamGoal' ? toTeamGoalInput(value) : value;

    setValues((current) => ({ ...current, [field]: typed }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const validate = useCallback(() => {
    const found = validateTeamForm(values);
    setErrors(found);

    return found;
  }, [values]);

  const reset = useCallback((updated: CampaignTeamPage) => {
    const loaded = toValues(updated);
    setValues(loaded);
    setSaved(loaded);
    setErrors({});
  }, []);

  const hasUnsavedChanges = useMemo(
    () =>
      saved !== null &&
      (saved.name !== values.name ||
        saved.teamGoal !== values.teamGoal ||
        saved.story !== values.story),
    [saved, values],
  );

  return { values, errors, hasUnsavedChanges, setField, validate, reset };
}
