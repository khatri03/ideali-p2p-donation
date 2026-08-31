import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  charactersLeftNotice,
  DISPLAY_NAME_HINT,
  DISPLAY_NAME_LABEL,
  DISPLAY_NAME_MAX_LENGTH,
  OPTIONAL_MARK,
  PERSONAL_GOAL_HINT,
  PERSONAL_GOAL_LABEL,
  PERSONAL_GOAL_PLACEHOLDER,
  STORY_HINT,
  STORY_LABEL,
  STORY_MAX_LENGTH,
} from './joinCopy';
import { FundraiserJoinFormState } from './useFundraiserJoinForm';

interface FundraiserJoinFieldsProps {
  form: FundraiserJoinFormState;
  isDisabled: boolean;
}

const LABEL_PROPS = { fontSize: { base: 'sm', md: 'md' }, mb: 1 } as const;

/** Says a field may be left alone, so the required marker on one field is not read as a rule for all three. */
const OptionalLabel = ({ children }: { children: string }) => (
  <>
    {children}{' '}
    <Text as="span" fontSize="xs" fontWeight="400" color="gray.500" _dark={{ color: 'gray.400' }}>
      ({OPTIONAL_MARK})
    </Text>
  </>
);

/**
 * The three answers a supporter gives. Presentational only: every rule that decides whether an
 * answer is acceptable lives in the form hook, and the server checks the same rules again.
 */
export const FundraiserJoinFields = ({ form, isDisabled }: FundraiserJoinFieldsProps) => {
  const nameCharactersLeft = charactersLeftNotice(form.displayName.length, DISPLAY_NAME_MAX_LENGTH);
  const storyCharactersLeft = charactersLeftNotice(form.story.length, STORY_MAX_LENGTH);

  return (
    <Stack gap={5}>
      <FormControl isInvalid={Boolean(form.errors.displayName)} isRequired>
        <FormLabel htmlFor="fundraiser-display-name" {...LABEL_PROPS}>
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
          <FormHelperText>{nameCharactersLeft ?? DISPLAY_NAME_HINT}</FormHelperText>
        )}
      </FormControl>

      <FormControl isInvalid={Boolean(form.errors.personalGoal)}>
        <FormLabel htmlFor="fundraiser-personal-goal" {...LABEL_PROPS}>
          <OptionalLabel>{PERSONAL_GOAL_LABEL}</OptionalLabel>
        </FormLabel>
        <InputGroup>
          <InputLeftAddon minH="44px">$</InputLeftAddon>
          <Input
            id="fundraiser-personal-goal"
            type="number"
            inputMode="decimal"
            min={1}
            step="1"
            placeholder={PERSONAL_GOAL_PLACEHOLDER}
            value={form.goalInput}
            onChange={(event) => form.setGoalInput(event.target.value)}
            isDisabled={isDisabled}
            minH="44px"
            sx={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
          />
        </InputGroup>
        {form.errors.personalGoal ? (
          <FormErrorMessage>{form.errors.personalGoal}</FormErrorMessage>
        ) : (
          <FormHelperText>{PERSONAL_GOAL_HINT}</FormHelperText>
        )}
      </FormControl>

      <FormControl isInvalid={Boolean(form.errors.story)}>
        <FormLabel htmlFor="fundraiser-story" {...LABEL_PROPS}>
          <OptionalLabel>{STORY_LABEL}</OptionalLabel>
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
          <FormHelperText>{storyCharactersLeft ?? STORY_HINT}</FormHelperText>
        )}
      </FormControl>
    </Stack>
  );
};

export default FundraiserJoinFields;
