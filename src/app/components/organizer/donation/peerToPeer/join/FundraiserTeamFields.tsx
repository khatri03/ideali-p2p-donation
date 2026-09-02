import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';
import { CampaignTeamSummary } from 'app/interface/donationInter/campaignTeamDto';
import { FundraiserTeamChoiceKind } from 'app/interface/donationInter/fundraiserJoinDto';
import {
  charactersLeftNotice,
  OPTIONAL_MARK,
  TEAM_ALONE_HINT,
  TEAM_ALONE_LABEL,
  TEAM_CHOICE_HINT,
  TEAM_CHOICE_LABEL,
  TEAM_CREATE_HINT,
  TEAM_CREATE_LABEL,
  TEAM_GOAL_HINT,
  TEAM_GOAL_LABEL,
  TEAM_GOAL_PLACEHOLDER,
  TEAM_JOIN_HINT,
  TEAM_JOIN_LABEL,
  TEAM_NAME_HINT,
  TEAM_NAME_LABEL,
  TEAM_NAME_MAX_LENGTH,
  TEAM_PICKER_EMPTY,
  TEAM_PICKER_LABEL,
  TEAM_PICKER_LOAD_FAILED,
  TEAM_PICKER_LOADING,
  TEAM_PICKER_PLACEHOLDER,
  TEAM_PICKER_RETRY,
} from './joinCopy';
import { FundraiserJoinFormState } from './useFundraiserJoinForm';

interface FundraiserTeamFieldsProps {
  form: FundraiserJoinFormState;
  teams: CampaignTeamSummary[];
  isLoadingTeams: boolean;
  teamsError: string | null;
  onRetryTeams: () => void;
  isDisabled: boolean;
}

const LABEL_PROPS = { fontSize: { base: 'sm', md: 'md' }, mb: 1 } as const;

/**
 * Left inset that lines a follow-up field up with the wording of the answer it belongs to rather than
 * with the radio control itself, so the field reads as part of that answer.
 */
const FOLLOW_UP_INSET = { base: 7, md: 8 } as const;

const CHOICES: { value: FundraiserTeamChoiceKind; label: string; hint: string }[] = [
  { value: 'None', label: TEAM_ALONE_LABEL, hint: TEAM_ALONE_HINT },
  { value: 'JoinExisting', label: TEAM_JOIN_LABEL, hint: TEAM_JOIN_HINT },
  { value: 'CreateNew', label: TEAM_CREATE_LABEL, hint: TEAM_CREATE_HINT },
];

/** One radio and the sentence that says what picking it means, so the choice is made from the screen. */
const ChoiceOption = ({
  value,
  label,
  hint,
  isDisabled,
}: {
  value: FundraiserTeamChoiceKind;
  label: string;
  hint: string;
  isDisabled: boolean;
}) => (
  <Radio
    value={value}
    alignItems="flex-start"
    py={2}
    minH="44px"
    isDisabled={isDisabled}
    sx={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
  >
    <Stack gap={0} mt="-2px">
      <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="600">
        {label}
      </Text>
      <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
        {hint}
      </Text>
    </Stack>
  </Radio>
);

/** The teams already running on the campaign, offered only once somebody says they want to join one. */
const ExistingTeamField = ({
  form,
  teams,
  isLoadingTeams,
  teamsError,
  onRetryTeams,
  isDisabled,
}: FundraiserTeamFieldsProps) => {
  const hasNoTeamsToJoin = !isLoadingTeams && !teamsError && teams.length === 0;
  const isPickerDisabled = isDisabled || isLoadingTeams || hasNoTeamsToJoin;

  return (
    <FormControl isInvalid={Boolean(form.errors.teamSlug)} isRequired>
      <FormLabel htmlFor="fundraiser-team-slug" {...LABEL_PROPS}>
        {TEAM_PICKER_LABEL}
      </FormLabel>
      <Select
        id="fundraiser-team-slug"
        value={form.teamSlug}
        placeholder={isLoadingTeams ? TEAM_PICKER_LOADING : TEAM_PICKER_PLACEHOLDER}
        onChange={(event) => form.setTeamSlug(event.target.value)}
        isDisabled={isPickerDisabled}
        minH="44px"
        sx={{ cursor: isPickerDisabled ? 'not-allowed' : 'pointer' }}
      >
        {teams.map((team) => (
          <option key={team.slug} value={team.slug}>
            {team.name}
          </option>
        ))}
      </Select>

      {form.errors.teamSlug && <FormErrorMessage>{form.errors.teamSlug}</FormErrorMessage>}

      {!form.errors.teamSlug && hasNoTeamsToJoin && (
        <FormHelperText>{TEAM_PICKER_EMPTY}</FormHelperText>
      )}

      {teamsError && (
        <FormHelperText>
          <Stack direction="row" align="center" gap={2}>
            <Text as="span" fontSize="sm">
              {TEAM_PICKER_LOAD_FAILED}
            </Text>
            <Button
              size="sm"
              variant="outline"
              minH="44px"
              onClick={onRetryTeams}
              isDisabled={isDisabled}
              sx={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            >
              {TEAM_PICKER_RETRY}
            </Button>
          </Stack>
        </FormHelperText>
      )}
    </FormControl>
  );
};

/** What a new team needs before it can exist, asked under the answer that says one is being started. */
const NewTeamFields = ({
  form,
  isDisabled,
}: Pick<FundraiserTeamFieldsProps, 'form' | 'isDisabled'>) => {
  const teamNameCharactersLeft = charactersLeftNotice(form.teamName.length, TEAM_NAME_MAX_LENGTH);

  return (
    <Stack gap={4}>
      <FormControl isInvalid={Boolean(form.errors.teamName)} isRequired>
        <FormLabel htmlFor="fundraiser-team-name" {...LABEL_PROPS}>
          {TEAM_NAME_LABEL}
        </FormLabel>
        <Input
          id="fundraiser-team-name"
          value={form.teamName}
          maxLength={TEAM_NAME_MAX_LENGTH}
          onChange={(event) => form.setTeamName(event.target.value)}
          isDisabled={isDisabled}
          minH="44px"
          sx={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
        />
        {form.errors.teamName ? (
          <FormErrorMessage>{form.errors.teamName}</FormErrorMessage>
        ) : (
          <FormHelperText>{teamNameCharactersLeft ?? TEAM_NAME_HINT}</FormHelperText>
        )}
      </FormControl>

      <FormControl isInvalid={Boolean(form.errors.teamGoal)}>
        <FormLabel htmlFor="fundraiser-team-goal" {...LABEL_PROPS}>
          {TEAM_GOAL_LABEL}{' '}
          <Text
            as="span"
            fontSize="xs"
            fontWeight="400"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
          >
            ({OPTIONAL_MARK})
          </Text>
        </FormLabel>
        <InputGroup>
          <InputLeftAddon minH="44px">$</InputLeftAddon>
          <Input
            id="fundraiser-team-goal"
            type="number"
            inputMode="decimal"
            min={1}
            step="1"
            placeholder={TEAM_GOAL_PLACEHOLDER}
            value={form.teamGoalInput}
            onChange={(event) => form.setTeamGoalInput(event.target.value)}
            isDisabled={isDisabled}
            minH="44px"
            sx={{ cursor: isDisabled ? 'not-allowed' : 'text' }}
          />
        </InputGroup>
        {form.errors.teamGoal ? (
          <FormErrorMessage>{form.errors.teamGoal}</FormErrorMessage>
        ) : (
          <FormHelperText>{TEAM_GOAL_HINT}</FormHelperText>
        )}
      </FormControl>
    </Stack>
  );
};

/**
 * The team question and whichever follow-up the answer needs. Presentational only: every rule that
 * decides whether an answer is acceptable lives in the form hook, and the server checks them again.
 *
 * The follow-up sits immediately beneath the answer that asks for it rather than below the whole
 * question, so it reads as part of that answer instead of as a second question of its own.
 *
 * A campaign that does not use teams never renders this at all, so the question is asked only where it
 * has an answer.
 */
export const FundraiserTeamFields = (props: FundraiserTeamFieldsProps) => {
  const { form, isDisabled } = props;

  return (
    <FormControl as="fieldset">
      <FormLabel as="legend" {...LABEL_PROPS}>
        {TEAM_CHOICE_LABEL}
      </FormLabel>
      <RadioGroup
        value={form.teamChoice}
        onChange={(value) => form.setTeamChoice(value as FundraiserTeamChoiceKind)}
      >
        <Stack gap={1}>
          {CHOICES.map((choice) => (
            <Stack key={choice.value} gap={2}>
              <ChoiceOption
                value={choice.value}
                label={choice.label}
                hint={choice.hint}
                isDisabled={isDisabled}
              />

              {form.teamChoice === choice.value && choice.value !== 'None' && (
                <Box pl={FOLLOW_UP_INSET} pb={2}>
                  {choice.value === 'JoinExisting' ? (
                    <ExistingTeamField {...props} />
                  ) : (
                    <NewTeamFields form={form} isDisabled={isDisabled} />
                  )}
                </Box>
              )}
            </Stack>
          ))}
        </Stack>
      </RadioGroup>
      <FormHelperText>{TEAM_CHOICE_HINT}</FormHelperText>
    </FormControl>
  );
};

export default FundraiserTeamFields;
