import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  GOAL_HELP,
  GOAL_LABEL,
  NAME_HELP,
  NAME_LABEL,
  STORY_HELP,
  STORY_LABEL,
  storyRemaining,
} from './consoleCopy';
import {
  EditFundraiserErrors,
  EditFundraiserValues,
  NAME_MAX_LENGTH,
  STORY_MAX_LENGTH,
} from './useEditFundraiserForm';

interface EditFundraiserFieldsProps {
  values: EditFundraiserValues;
  errors: EditFundraiserErrors;
  currencySymbol: string;
  isDisabled: boolean;
  onChange: (field: keyof EditFundraiserValues, value: string) => void;
}

/**
 * The three fields a supporter owns. Presentational: it renders what it is given and reports what was
 * typed, so the same fields could be reused by any screen that edits a page.
 */
export const EditFundraiserFields = ({
  values,
  errors,
  currencySymbol,
  isDisabled,
  onChange,
}: EditFundraiserFieldsProps) => (
  <Stack gap={5}>
    <FormControl isInvalid={Boolean(errors.displayName)} isRequired>
      <FormLabel htmlFor="fundraiser-display-name">{NAME_LABEL}</FormLabel>
      <Input
        id="fundraiser-display-name"
        value={values.displayName}
        maxLength={NAME_MAX_LENGTH}
        isDisabled={isDisabled}
        onChange={(event) => onChange('displayName', event.target.value)}
        minH="44px"
        borderRadius="12px"
      />
      {errors.displayName ? (
        <FormErrorMessage>{errors.displayName}</FormErrorMessage>
      ) : (
        <FormHelperText>{NAME_HELP}</FormHelperText>
      )}
    </FormControl>

    <FormControl isInvalid={Boolean(errors.personalGoal)}>
      <FormLabel htmlFor="fundraiser-goal">
        {currencySymbol ? `${GOAL_LABEL} (${currencySymbol})` : GOAL_LABEL}
      </FormLabel>
      <Input
        id="fundraiser-goal"
        value={values.personalGoal}
        inputMode="decimal"
        isDisabled={isDisabled}
        onChange={(event) => onChange('personalGoal', event.target.value)}
        minH="44px"
        borderRadius="12px"
      />
      {errors.personalGoal ? (
        <FormErrorMessage>{errors.personalGoal}</FormErrorMessage>
      ) : (
        <FormHelperText>{GOAL_HELP}</FormHelperText>
      )}
    </FormControl>

    <FormControl isInvalid={Boolean(errors.story)}>
      <FormLabel htmlFor="fundraiser-story">{STORY_LABEL}</FormLabel>
      <Textarea
        id="fundraiser-story"
        value={values.story}
        maxLength={STORY_MAX_LENGTH}
        rows={7}
        isDisabled={isDisabled}
        onChange={(event) => onChange('story', event.target.value)}
        borderRadius="12px"
      />
      {errors.story ? (
        <FormErrorMessage>{errors.story}</FormErrorMessage>
      ) : (
        <FormHelperText>{STORY_HELP}</FormHelperText>
      )}
      <Text mt={1} fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
        {storyRemaining(values.story.length, STORY_MAX_LENGTH)}
      </Text>
    </FormControl>
  </Stack>
);

export default EditFundraiserFields;
