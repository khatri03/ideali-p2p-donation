import { useState } from 'react';
import {
  FundraiserJoinContext,
  FundraiserJoinRequest,
  FundraiserTeamChoice,
  FundraiserTeamChoiceKind,
} from 'app/interface/donationInter/fundraiserJoinDto';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_REQUIRED,
  DISPLAY_NAME_TOO_LONG,
  GOAL_NOT_POSITIVE,
  STORY_MAX_LENGTH,
  STORY_TOO_LONG,
  TEAM_GOAL_NOT_POSITIVE,
  TEAM_NAME_MAX_LENGTH,
  TEAM_NAME_REQUIRED,
  TEAM_NAME_TOO_LONG,
  TEAM_REQUIRED,
} from './joinCopy';

export interface FundraiserJoinFormErrors {
  displayName?: string;
  personalGoal?: string;
  story?: string;
  teamSlug?: string;
  teamName?: string;
  teamGoal?: string;
}

export interface FundraiserJoinFormState {
  displayName: string;
  goalInput: string;
  story: string;
  teamChoice: FundraiserTeamChoiceKind;
  teamSlug: string;
  teamName: string;
  teamGoalInput: string;
  errors: FundraiserJoinFormErrors;
  setDisplayName: (displayName: string) => void;
  setGoalInput: (goal: string) => void;
  setStory: (story: string) => void;
  setTeamChoice: (choice: FundraiserTeamChoiceKind) => void;
  setTeamSlug: (slug: string) => void;
  setTeamName: (name: string) => void;
  setTeamGoalInput: (goal: string) => void;
  validate: () => boolean;
  buildRequest: () => FundraiserJoinRequest;
}

const toGoalInput = (goal: number | null) => (goal === null ? '' : String(goal));

const toAmount = (input: string): number | null => (input.trim() === '' ? null : Number(input));

/** An amount a caller typed is acceptable when it is blank, or a number above zero. */
const isAcceptableAmount = (input: string): boolean => {
  if (input.trim() === '') {
    return true;
  }

  const amount = Number(input);

  return Number.isFinite(amount) && amount > 0;
};

/**
 * The team a supporter arrived with, pre-selected. Somebody who followed a captain's link has already
 * chosen; making them choose the same team again from a list is the confusion this carries away.
 */
const initialChoice = (
  context: FundraiserJoinContext,
  invitedTeamSlug: string | null,
): FundraiserTeamChoiceKind =>
  context.areTeamsAllowed && invitedTeamSlug ? 'JoinExisting' : 'None';

/**
 * Holds the supporter's answers plus the rules that reject them. The same rules run on the server;
 * these exist so an invalid field explains itself before a round trip, never as the only check.
 */
export function useFundraiserJoinForm(
  context: FundraiserJoinContext,
  suggestedDisplayName: string,
  invitedTeamSlug: string | null = null,
): FundraiserJoinFormState {
  const [displayName, setDisplayName] = useState(suggestedDisplayName);
  const [goalInput, setGoalInput] = useState(toGoalInput(context.defaultPersonalGoal));
  const [story, setStory] = useState('');
  const [teamChoice, setTeamChoice] = useState<FundraiserTeamChoiceKind>(
    initialChoice(context, invitedTeamSlug),
  );
  const [teamSlug, setTeamSlug] = useState(invitedTeamSlug ?? '');
  const [teamName, setTeamName] = useState('');
  const [teamGoalInput, setTeamGoalInput] = useState('');
  const [errors, setErrors] = useState<FundraiserJoinFormErrors>({});

  const validatePage = (found: FundraiserJoinFormErrors) => {
    const trimmedName = displayName.trim();

    if (trimmedName === '') {
      found.displayName = DISPLAY_NAME_REQUIRED;
    } else if (trimmedName.length > DISPLAY_NAME_MAX_LENGTH) {
      found.displayName = DISPLAY_NAME_TOO_LONG;
    }

    if (!isAcceptableAmount(goalInput)) {
      found.personalGoal = GOAL_NOT_POSITIVE;
    }

    if (story.trim().length > STORY_MAX_LENGTH) {
      found.story = STORY_TOO_LONG;
    }
  };

  const validateTeam = (found: FundraiserJoinFormErrors) => {
    if (!context.areTeamsAllowed || teamChoice === 'None') {
      return;
    }

    if (teamChoice === 'JoinExisting') {
      if (teamSlug.trim() === '') {
        found.teamSlug = TEAM_REQUIRED;
      }

      return;
    }

    const trimmedTeamName = teamName.trim();

    if (trimmedTeamName === '') {
      found.teamName = TEAM_NAME_REQUIRED;
    } else if (trimmedTeamName.length > TEAM_NAME_MAX_LENGTH) {
      found.teamName = TEAM_NAME_TOO_LONG;
    }

    if (!isAcceptableAmount(teamGoalInput)) {
      found.teamGoal = TEAM_GOAL_NOT_POSITIVE;
    }
  };

  const validate = (): boolean => {
    const found: FundraiserJoinFormErrors = {};

    validatePage(found);
    validateTeam(found);
    setErrors(found);

    return Object.keys(found).length === 0;
  };

  const buildTeamChoice = (): FundraiserTeamChoice => {
    if (!context.areTeamsAllowed || teamChoice === 'None') {
      return { kind: 'None', teamSlug: null, newTeam: null };
    }

    if (teamChoice === 'JoinExisting') {
      return { kind: 'JoinExisting', teamSlug: teamSlug.trim(), newTeam: null };
    }

    return {
      kind: 'CreateNew',
      teamSlug: null,
      newTeam: {
        name: teamName.trim(),
        story: null,
        teamGoal: toAmount(teamGoalInput),
      },
    };
  };

  const buildRequest = (): FundraiserJoinRequest => ({
    displayName: displayName.trim(),
    personalGoal: toAmount(goalInput),
    story: story.trim() === '' ? null : story.trim(),
    team: buildTeamChoice(),
  });

  return {
    displayName,
    goalInput,
    story,
    teamChoice,
    teamSlug,
    teamName,
    teamGoalInput,
    errors,
    setDisplayName,
    setGoalInput,
    setStory,
    setTeamChoice,
    setTeamSlug,
    setTeamName,
    setTeamGoalInput,
    validate,
    buildRequest,
  };
}
