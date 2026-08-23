import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MyFundraisingPage,
  FundraiserPageUpdate,
} from 'app/interface/donationInter/fundraiserConsoleDto';
import {
  GOAL_NOT_A_NUMBER,
  GOAL_TOO_SMALL,
  NAME_REQUIRED,
  goalTooLarge,
  nameTooLong,
  storyTooLong,
} from './consoleCopy';

/** The same limits the server enforces. Duplicated here for the message, never trusted instead of it. */
export const NAME_MAX_LENGTH = 80;
export const STORY_MAX_LENGTH = 2000;
export const GOAL_MAXIMUM = 10_000_000;
export const GOAL_DECIMAL_PLACES = 2;

/**
 * Money is typed one keystroke at a time, so the field keeps only what a money amount can contain:
 * digits, a single decimal point, and two places after it. Letters, a second point and an exponent
 * never reach the value, so the field cannot hold a figure the server would refuse, and a supporter
 * finds out on the keystroke rather than on the save.
 */
export const toGoalInput = (typed: string): string => {
  const [whole, ...afterTheFirstPoint] = typed.replace(/[^\d.]/g, '').split('.');

  if (!afterTheFirstPoint.length) return whole;

  return `${whole || '0'}.${afterTheFirstPoint.join('').slice(0, GOAL_DECIMAL_PLACES)}`;
};

export interface EditFundraiserValues {
  displayName: string;
  /** Held as text so a half-typed number is not silently turned into something else. */
  personalGoal: string;
  story: string;
}

export type EditFundraiserErrors = Partial<Record<keyof EditFundraiserValues, string>>;

const toValues = (page: MyFundraisingPage): EditFundraiserValues => ({
  displayName: page.displayName,
  personalGoal: page.goal === null ? '' : String(page.goal),
  story: page.story ?? '',
});

export const validateEditFundraiser = (values: EditFundraiserValues): EditFundraiserErrors => {
  const errors: EditFundraiserErrors = {};
  const name = values.displayName.trim();

  if (!name) {
    errors.displayName = NAME_REQUIRED;
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.displayName = nameTooLong(NAME_MAX_LENGTH);
  }

  const goalText = values.personalGoal.trim();

  if (goalText) {
    const goal = Number(goalText);

    if (!Number.isFinite(goal)) {
      errors.personalGoal = GOAL_NOT_A_NUMBER;
    } else if (goal <= 0) {
      errors.personalGoal = GOAL_TOO_SMALL;
    } else if (goal > GOAL_MAXIMUM) {
      errors.personalGoal = goalTooLarge(GOAL_MAXIMUM);
    }
  }

  if (values.story.trim().length > STORY_MAX_LENGTH) {
    errors.story = storyTooLong(STORY_MAX_LENGTH);
  }

  return errors;
};

export const toUpdateRequest = (values: EditFundraiserValues): FundraiserPageUpdate => {
  const goalText = values.personalGoal.trim();
  const story = values.story.trim();

  return {
    displayName: values.displayName.trim(),
    personalGoal: goalText ? Number(goalText) : null,
    story: story ? story : null,
  };
};

interface EditFundraiserForm {
  values: EditFundraiserValues;
  errors: EditFundraiserErrors;
  hasUnsavedChanges: boolean;
  setField: (field: keyof EditFundraiserValues, value: string) => void;
  validate: () => EditFundraiserErrors;
  reset: (page: MyFundraisingPage) => void;
}

/**
 * Holds what the supporter has typed, what is wrong with it, and whether anything is unsaved. Kept out
 * of the screen so the screen stays composition, and out of the service so the rules have one home.
 */
export function useEditFundraiserForm(page: MyFundraisingPage | null): EditFundraiserForm {
  const [values, setValues] = useState<EditFundraiserValues>({
    displayName: '',
    personalGoal: '',
    story: '',
  });
  const [saved, setSaved] = useState<EditFundraiserValues | null>(null);
  const [errors, setErrors] = useState<EditFundraiserErrors>({});

  useEffect(() => {
    if (page) {
      const loaded = toValues(page);
      setValues(loaded);
      setSaved(loaded);
      setErrors({});
    }
  }, [page]);

  const setField = useCallback((field: keyof EditFundraiserValues, value: string) => {
    const typed = field === 'personalGoal' ? toGoalInput(value) : value;

    setValues((current) => ({ ...current, [field]: typed }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const validate = useCallback(() => {
    const found = validateEditFundraiser(values);
    setErrors(found);

    return found;
  }, [values]);

  const reset = useCallback((updated: MyFundraisingPage) => {
    const loaded = toValues(updated);
    setValues(loaded);
    setSaved(loaded);
    setErrors({});
  }, []);

  const hasUnsavedChanges = useMemo(
    () =>
      saved !== null &&
      (saved.displayName !== values.displayName ||
        saved.personalGoal !== values.personalGoal ||
        saved.story !== values.story),
    [saved, values],
  );

  return { values, errors, hasUnsavedChanges, setField, validate, reset };
}
