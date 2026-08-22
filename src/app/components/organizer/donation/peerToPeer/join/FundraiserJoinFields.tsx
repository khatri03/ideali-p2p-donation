import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import {
  DISPLAY_NAME_HINT,
  DISPLAY_NAME_LABEL,
  DISPLAY_NAME_MAX_LENGTH,
  PERSONAL_GOAL_LABEL,
  STORY_HINT,
  STORY_LABEL,
  STORY_MAX_LENGTH,
} from './joinCopy';
import { FundraiserJoinFormState } from './useFundraiserJoinForm';

interface FundraiserJoinFieldsProps {
  form: FundraiserJoinFormState;
  isDisabled: boolean;
}

/**
 * The three answers a supporter gives. Presentational only: every rule that decides whether an
 * answer is acceptable lives in the form hook, and the server checks the same rules again.
 */
export const FundraiserJoinFields = ({ form, isDisabled }: FundraiserJoinFieldsProps) => (
  <Stack gap={5}>
    <FormControl isInvalid={Boolean(form.errors.displayName)} isRequired>
      <FormLabel htmlFor="fundraiser-display-name" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
        {DISPLAY_NAME_LABEL}
      </FormLabel>
      <Input
        id="fundraiser-display-name"
        value={form.displayName}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        onChange={(event) => form.setDisplayName(event.target.value)}
        isDisabled={isDisabled}
        minH="44px"
        sx={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
      />
      {form.errors.displayName ? (
        <FormErrorMessage>{form.errors.displayName}</FormErrorMessage>
      ) : (
        <FormHelperText>{DISPLAY_NAME_HINT}</FormHelperText>
      )}
    </FormControl>

    <FormControl isInvalid={Boolean(form.errors.personalGoal)}>
      <FormLabel htmlFor="fundraiser-personal-goal" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
        {PERSONAL_GOAL_LABEL}
      </FormLabel>
      <Input
        id="fundraiser-personal-goal"
        type="number"
        inputMode="decimal"
        min={1}
        value={form.goalInput}
        onChange={(event) => form.setGoalInput(event.target.value)}
        isDisabled={isDisabled}
        minH="44px"
        sx={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
      />
      {form.errors.personalGoal && (
        <FormErrorMessage>{form.errors.personalGoal}</FormErrorMessage>
      )}
    </FormControl>

    <FormControl isInvalid={Boolean(form.errors.story)}>
      <FormLabel htmlFor="fundraiser-story" fontSize={{ base: 'sm', md: 'md' }} mb={1}>
        {STORY_LABEL}
      </FormLabel>
      <Textarea
        id="fundraiser-story"
        value={form.story}
        maxLength={STORY_MAX_LENGTH}
        rows={4}
        onChange={(event) => form.setStory(event.target.value)}
        isDisabled={isDisabled}
        sx={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
      />
      {form.errors.story ? (
        <FormErrorMessage>{form.errors.story}</FormErrorMessage>
      ) : (
        <FormHelperText>{STORY_HINT}</FormHelperText>
      )}
    </FormControl>
  </Stack>
);

export default FundraiserJoinFields;
