import { describe, expect, it } from 'vitest';
import {
  EditFundraiserValues,
  GOAL_MAXIMUM,
  NAME_MAX_LENGTH,
  STORY_MAX_LENGTH,
  toUpdateRequest,
  validateEditFundraiser,
} from './useEditFundraiserForm';

const values = (overrides: Partial<EditFundraiserValues> = {}): EditFundraiserValues => ({
  displayName: 'Sarah Khan',
  personalGoal: '500',
  story: 'My uncle walks four kilometres for water.',
  ...overrides,
});

describe('useEditFundraiserForm rules', () => {
  it('Validate_EverythingFilledIn_FindsNothingWrong', () => {
    expect(validateEditFundraiser(values())).toEqual({});
  });

  it('Validate_NameOfOnlySpaces_IsRejectedBecauseDonorsWouldSeeNothing', () => {
    expect(validateEditFundraiser(values({ displayName: '   ' })).displayName).toBe(
      'Enter the name to show on your fundraising page.',
    );
  });

  it('Validate_NameLongerThanTheLimit_IsRejected', () => {
    const errors = validateEditFundraiser(values({ displayName: 'a'.repeat(NAME_MAX_LENGTH + 1) }));

    expect(errors.displayName).toBe(
      `The name on your page must be ${NAME_MAX_LENGTH} characters or fewer.`,
    );
  });

  it('Validate_BlankGoal_IsAllowedBecauseAPageMayShowATotalWithoutATarget', () => {
    expect(validateEditFundraiser(values({ personalGoal: '  ' })).personalGoal).toBeUndefined();
  });

  it('Validate_GoalThatIsNotANumber_IsRejected', () => {
    expect(validateEditFundraiser(values({ personalGoal: 'lots' })).personalGoal).toBe(
      'Enter a goal as a number, or leave it blank.',
    );
  });

  it('Validate_GoalOfZero_IsRejected', () => {
    expect(validateEditFundraiser(values({ personalGoal: '0' })).personalGoal).toBe(
      'Enter a goal greater than zero, or leave it blank.',
    );
  });

  it('Validate_NegativeGoal_IsRejected', () => {
    expect(validateEditFundraiser(values({ personalGoal: '-10' })).personalGoal).toBeTruthy();
  });

  it('Validate_AbsurdlyLargeGoal_IsRejected', () => {
    const errors = validateEditFundraiser(values({ personalGoal: String(GOAL_MAXIMUM + 1) }));

    expect(errors.personalGoal).toBe(`Enter a goal of ${GOAL_MAXIMUM.toLocaleString()} or less.`);
  });

  it('Validate_StoryLongerThanTheLimit_IsRejected', () => {
    const errors = validateEditFundraiser(values({ story: 'a'.repeat(STORY_MAX_LENGTH + 1) }));

    expect(errors.story).toBe(`Your story must be ${STORY_MAX_LENGTH} characters or fewer.`);
  });

  it('Request_TypedValues_AreTrimmedAndTheGoalBecomesANumber', () => {
    const request = toUpdateRequest(values({ displayName: '  Sara M  ', personalGoal: ' 750 ' }));

    expect(request.displayName).toBe('Sara M');
    expect(request.personalGoal).toBe(750);
  });

  it('Request_EmptyGoalAndStory_AreSentAsNullRatherThanEmptyStrings', () => {
    const request = toUpdateRequest(values({ personalGoal: '', story: '   ' }));

    expect(request.personalGoal).toBeNull();
    expect(request.story).toBeNull();
  });
});
