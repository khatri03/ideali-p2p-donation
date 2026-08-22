import { useState } from 'react';
import {
  FundraiserJoinContext,
  FundraiserJoinRequest,
} from 'app/interface/donationInter/fundraiserJoinDto';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_REQUIRED,
  DISPLAY_NAME_TOO_LONG,
  GOAL_NOT_POSITIVE,
  STORY_MAX_LENGTH,
  STORY_TOO_LONG,
} from './joinCopy';

export interface FundraiserJoinFormErrors {
  displayName?: string;
  personalGoal?: string;
  story?: string;
}

export interface FundraiserJoinFormState {
  displayName: string;
  goalInput: string;
  story: string;
  errors: FundraiserJoinFormErrors;
  setDisplayName: (displayName: string) => void;
  setGoalInput: (goal: string) => void;
  setStory: (story: string) => void;
  validate: () => boolean;
  buildRequest: () => FundraiserJoinRequest;
}

const toGoalInput = (goal: number | null) => (goal === null ? '' : String(goal));

/**
 * Holds the supporter's answers plus the rules that reject them. The same rules run on the server;
 * these exist so an invalid field explains itself before a round trip, never as the only check.
 */
export function useFundraiserJoinForm(
  context: FundraiserJoinContext,
  suggestedDisplayName: string,
): FundraiserJoinFormState {
  const [displayName, setDisplayName] = useState(suggestedDisplayName);
  const [goalInput, setGoalInput] = useState(toGoalInput(context.defaultPersonalGoal));
  const [story, setStory] = useState('');
  const [errors, setErrors] = useState<FundraiserJoinFormErrors>({});

  const validate = (): boolean => {
    const found: FundraiserJoinFormErrors = {};
    const trimmedName = displayName.trim();

    if (trimmedName === '') {
      found.displayName = DISPLAY_NAME_REQUIRED;
    } else if (trimmedName.length > DISPLAY_NAME_MAX_LENGTH) {
      found.displayName = DISPLAY_NAME_TOO_LONG;
    }

    if (goalInput.trim() !== '') {
      const goal = Number(goalInput);

      if (!Number.isFinite(goal) || goal <= 0) {
        found.personalGoal = GOAL_NOT_POSITIVE;
      }
    }

    if (story.trim().length > STORY_MAX_LENGTH) {
      found.story = STORY_TOO_LONG;
    }

    setErrors(found);

    return Object.keys(found).length === 0;
  };

  const buildRequest = (): FundraiserJoinRequest => ({
    displayName: displayName.trim(),
    personalGoal: goalInput.trim() === '' ? null : Number(goalInput),
    story: story.trim() === '' ? null : story.trim(),
  });

  return {
    displayName,
    goalInput,
    story,
    errors,
    setDisplayName,
    setGoalInput,
    setStory,
    validate,
    buildRequest,
  };
}
