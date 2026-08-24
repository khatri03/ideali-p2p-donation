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
  GOAL_HELP,
  GOAL_LABEL,
  NAME_HELP,
  NAME_LABEL,
  STORY_HELP,
  STORY_LABEL,
  storyRemaining,
} from './teamCopy';
import { TEAM_NAME_MAX_LENGTH, TEAM_STORY_MAX_LENGTH, TeamFormErrors, TeamFormValues } from './useTeamForm';

interface TeamFormFieldsProps {
  values: TeamFormValues;
  errors: TeamFormErrors;
  currencySymbol: string;
  isDisabled: boolean;
  onChange: (field: keyof TeamFormValues, value: string) => void;
}

/**
 * The three fields a team has, shared by the create screen and the edit screen so a rule can never be
 * enforced on one and not the other. Presentational: it reports keystrokes and renders errors it is
 * handed, and decides nothing.
 */
export const TeamFormFields = ({
  values,
  errors,
  currencySymbol,
  isDisabled,
  onChange,
}: TeamFormFieldsProps) => (
  <Stack gap={{ base: 4, md: 5 }}>
    <FormControl isInvalid={Boolean(errors.name)} isRequired>
      <FormLabel htmlFor="team-name">{NAME_LABEL}</FormLabel>
      <Input
        id="team-name"
        value={values.name}
        onChange={(event) => onChange('name', event.target.value)}
        maxLength={TEAM_NAME_MAX_LENGTH}
        isDisabled={isDisabled}
        minH="44px"
        borderRadius="12px"
        cursor={isDisabled ? 'not-allowed' : 'text'}
      />
      {errors.name ? (
        <FormErrorMessage>{errors.name}</FormErrorMessage>
      ) : (
        <FormHelperText>{NAME_HELP}</FormHelperText>
      )}
    </FormControl>

    <FormControl isInvalid={Boolean(errors.teamGoal)}>
      <FormLabel htmlFor="team-goal">{GOAL_LABEL}</FormLabel>
      <InputGroup>
        <InputLeftAddon minH="44px" borderLeftRadius="12px">
          {currencySymbol}
        </InputLeftAddon>
        <Input
          id="team-goal"
          value={values.teamGoal}
          onChange={(event) => onChange('teamGoal', event.target.value)}
          inputMode="decimal"
          isDisabled={isDisabled}
          minH="44px"
          borderRightRadius="12px"
          cursor={isDisabled ? 'not-allowed' : 'text'}
        />
      </InputGroup>
      {errors.teamGoal ? (
        <FormErrorMessage>{errors.teamGoal}</FormErrorMessage>
      ) : (
        <FormHelperText>{GOAL_HELP}</FormHelperText>
      )}
    </FormControl>

    <FormControl isInvalid={Boolean(errors.story)}>
      <FormLabel htmlFor="team-story">{STORY_LABEL}</FormLabel>
      <Textarea
        id="team-story"
        value={values.story}
        onChange={(event) => onChange('story', event.target.value)}
        maxLength={TEAM_STORY_MAX_LENGTH}
        rows={6}
        isDisabled={isDisabled}
        borderRadius="12px"
        cursor={isDisabled ? 'not-allowed' : 'text'}
      />
      {errors.story ? (
        <FormErrorMessage>{errors.story}</FormErrorMessage>
      ) : (
        <FormHelperText>
          <Stack direction={{ base: 'column', '2sm': 'row' }} justify="space-between" gap={1}>
            <Text as="span">{STORY_HELP}</Text>
            <Text as="span">{storyRemaining(values.story.length, TEAM_STORY_MAX_LENGTH)}</Text>
          </Stack>
        </FormHelperText>
      )}
    </FormControl>
  </Stack>
);

export default TeamFormFields;
