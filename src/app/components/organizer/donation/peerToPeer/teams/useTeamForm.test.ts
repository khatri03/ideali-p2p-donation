import { describe, expect, it } from 'vitest';
import {
  EMPTY_TEAM_FORM,
  TEAM_GOAL_MAXIMUM,
  TEAM_NAME_MAX_LENGTH,
  TEAM_STORY_MAX_LENGTH,
  toTeamGoalInput,
  toTeamSaveRequest,
  validateTeamForm,
} from './useTeamForm';

const values = (overrides: Partial<typeof EMPTY_TEAM_FORM> = {}) => ({
  ...EMPTY_TEAM_FORM,
  name: 'The Early Risers',
  ...overrides,
});

describe('team form rules', () => {
  it('Validate_NameLeftBlank_IsRefusedBeforeAnythingIsSent', () => {
    expect(validateTeamForm(values({ name: '   ' })).name).toBe('Enter a name for your team.');
  });

  it('Validate_NameLongerThanTheServerAllows_IsRefusedWithTheLimitInTheMessage', () => {
    const errors = validateTeamForm(values({ name: 'a'.repeat(TEAM_NAME_MAX_LENGTH + 1) }));

    expect(errors.name).toBe(`The team name must be ${TEAM_NAME_MAX_LENGTH} characters or fewer.`);
  });

  it('Validate_NameExactlyAtTheLimit_IsAccepted', () => {
    expect(validateTeamForm(values({ name: 'a'.repeat(TEAM_NAME_MAX_LENGTH) })).name).toBeUndefined();
  });

  it('Validate_GoalLeftBlank_IsAcceptedBecauseATeamNeedNotHaveATarget', () => {
    expect(validateTeamForm(values({ teamGoal: '' })).teamGoal).toBeUndefined();
  });

  it('Validate_GoalOfZero_IsRefused', () => {
    expect(validateTeamForm(values({ teamGoal: '0' })).teamGoal).toBe(
      'Enter a goal greater than zero, or leave it blank.',
    );
  });

  it('Validate_GoalAboveTheServerMaximum_IsRefusedWithTheLimitInTheMessage', () => {
    const errors = validateTeamForm(values({ teamGoal: String(TEAM_GOAL_MAXIMUM + 1) }));

    expect(errors.teamGoal).toBe(`Enter a goal of ${TEAM_GOAL_MAXIMUM.toLocaleString()} or less.`);
  });

  it('Validate_StoryLongerThanTheServerAllows_IsRefusedWithTheLimitInTheMessage', () => {
    const errors = validateTeamForm(values({ story: 'a'.repeat(TEAM_STORY_MAX_LENGTH + 1) }));

    expect(errors.story).toBe(`The team story must be ${TEAM_STORY_MAX_LENGTH} characters or fewer.`);
  });

  it('Validate_EverythingWithinTheLimits_ReportsNothingWrong', () => {
    expect(validateTeamForm(values({ teamGoal: '1000', story: 'We run.' }))).toEqual({});
  });

  it('GoalInput_LettersTyped_NeverReachTheValue', () => {
    expect(toTeamGoalInput('1a2b3c')).toBe('123');
  });

  it('GoalInput_SecondDecimalPointTyped_IsDroppedRatherThanBreakingTheNumber', () => {
    expect(toTeamGoalInput('12.34.56')).toBe('12.34');
  });

  it('GoalInput_MoreThanTwoDecimalPlaces_AreTrimmedOnTheKeystroke', () => {
    expect(toTeamGoalInput('12.3456')).toBe('12.34');
  });

  it('GoalInput_LeadingPoint_BecomesAZeroSoTheFieldIsNeverAmbiguous', () => {
    expect(toTeamGoalInput('.5')).toBe('0.5');
  });

  it('SaveRequest_BlankStoryAndGoal_AreSentAsNullRatherThanEmptyText', () => {
    expect(toTeamSaveRequest(values({ story: '   ', teamGoal: '  ' }))).toEqual({
      name: 'The Early Risers',
      story: null,
      teamGoal: null,
    });
  });

  it('SaveRequest_TypedValues_AreTrimmedAndTheGoalBecomesANumber', () => {
    expect(toTeamSaveRequest(values({ name: '  The Risers  ', story: '  We run.  ', teamGoal: '250' }))).toEqual({
      name: 'The Risers',
      story: 'We run.',
      teamGoal: 250,
    });
  });
});
