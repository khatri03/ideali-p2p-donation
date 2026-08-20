import {
  Alert,
  AlertIcon,
  Divider,
  FormControl,
  FormErrorMessage,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Switch,
  Text,
} from '@chakra-ui/react';
import {
  LeaderboardVisibility,
  PeerToPeerSettingsDetail,
} from 'app/interface/donationInter/peerToPeerDto';
import PeerToPeerSettingRow from './PeerToPeerSettingRow';
import { PeerToPeerSettingsFormState } from './usePeerToPeerSettingsForm';

interface PeerToPeerSettingsFieldsProps {
  settings: PeerToPeerSettingsDetail;
  form: PeerToPeerSettingsFormState;
  isSaving: boolean;
}

const LEADERBOARD_OPTIONS: Array<{ value: LeaderboardVisibility; label: string }> = [
  { value: 'Public', label: 'Everyone can see it' },
  { value: 'OrganizerOnly', label: 'Only our team can see it' },
  { value: 'Hidden', label: 'Nobody — hide the leaderboard' },
];

/**
 * The five peer-to-peer controls with no save behaviour of their own, so the settings page and the
 * campaign wizard step render one identical set of fields.
 */
export const PeerToPeerSettingsFields = ({
  settings,
  form,
  isSaving,
}: PeerToPeerSettingsFieldsProps) => {
  const { isSwitchLocked, areDetailsLocked } = form;

  return (
    <>
      {isSwitchLocked && settings.blockedReason && (
        <Alert status="info" borderRadius="12px" mt={4}>
          <AlertIcon />
          <Text fontSize="sm">{settings.blockedReason}</Text>
        </Alert>
      )}

      <Divider my={4} />

      <PeerToPeerSettingRow
        label="Turn supporter fundraising on"
        description="While this is off, nobody can create a new supporter page and existing pages are not reachable."
        htmlFor="peer-to-peer-enabled"
        isDisabled={isSwitchLocked}
        control={
          <Switch
            id="peer-to-peer-enabled"
            size="lg"
            isChecked={form.isEnabled}
            isDisabled={isSwitchLocked || isSaving}
            onChange={(event) => form.setIsEnabled(event.target.checked)}
            sx={{ cursor: isSwitchLocked || isSaving ? 'not-allowed' : 'pointer' }}
          />
        }
      />

      <Divider />

      <PeerToPeerSettingRow
        label="Suggested personal goal"
        description="Pre-filled when a supporter creates their page. They can change it. Leave blank for no suggestion."
        htmlFor="peer-to-peer-default-goal"
        isDisabled={areDetailsLocked}
        control={
          <FormControl isInvalid={Boolean(form.goalError)}>
            <InputGroup size="md">
              <InputLeftAddon>$</InputLeftAddon>
              <Input
                id="peer-to-peer-default-goal"
                type="number"
                min={1}
                step="1"
                inputMode="decimal"
                placeholder="No suggestion"
                value={form.goalInput}
                isDisabled={areDetailsLocked}
                onChange={(event) => form.setGoalInput(event.target.value)}
                onBlur={form.validate}
                sx={{ cursor: areDetailsLocked ? 'not-allowed' : 'text' }}
              />
            </InputGroup>
            {form.goalError && <FormErrorMessage fontSize="xs">{form.goalError}</FormErrorMessage>}
          </FormControl>
        }
      />

      <Divider />

      <PeerToPeerSettingRow
        label="Allow teams"
        description="Supporters can group their pages into a team and raise money towards a shared total."
        htmlFor="peer-to-peer-allow-teams"
        isDisabled={areDetailsLocked}
        control={
          <Switch
            id="peer-to-peer-allow-teams"
            size="lg"
            isChecked={form.allowTeams}
            isDisabled={areDetailsLocked}
            onChange={(event) => form.setAllowTeams(event.target.checked)}
            sx={{ cursor: areDetailsLocked ? 'not-allowed' : 'pointer' }}
          />
        }
      />

      <Divider />

      <PeerToPeerSettingRow
        label="Review pages before they go live"
        description="New supporter pages wait for someone on your team to approve them instead of publishing straight away."
        htmlFor="peer-to-peer-requires-approval"
        isDisabled={areDetailsLocked}
        control={
          <Switch
            id="peer-to-peer-requires-approval"
            size="lg"
            isChecked={form.requiresApproval}
            isDisabled={areDetailsLocked}
            onChange={(event) => form.setRequiresApproval(event.target.checked)}
            sx={{ cursor: areDetailsLocked ? 'not-allowed' : 'pointer' }}
          />
        }
      />

      <Divider />

      <PeerToPeerSettingRow
        label="Who can see the leaderboard"
        description="The leaderboard ranks supporters by the amount they have raised."
        htmlFor="peer-to-peer-leaderboard"
        isDisabled={areDetailsLocked}
        control={
          <Select
            id="peer-to-peer-leaderboard"
            value={form.leaderboardVisibility}
            isDisabled={areDetailsLocked}
            onChange={(event) =>
              form.setLeaderboardVisibility(event.target.value as LeaderboardVisibility)
            }
            sx={{ cursor: areDetailsLocked ? 'not-allowed' : 'pointer' }}
          >
            {LEADERBOARD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        }
      />
    </>
  );
};

export default PeerToPeerSettingsFields;
