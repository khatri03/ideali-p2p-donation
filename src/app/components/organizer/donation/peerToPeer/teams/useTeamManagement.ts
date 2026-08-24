import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import {
  handOverCampaignTeamCaptaincy,
  leaveCampaignTeam,
  removeCampaignTeamMember,
  updateCampaignTeam,
} from 'app/service/organizer/donation/campaignTeamService';
import { SAVED_MESSAGE } from './teamCopy';
import { PendingTeamAction } from './teamConfirmations';
import { browseTeamsPath, teamPagePath } from './teamPaths';
import { useTeamAction } from './useTeamAction';
import { TeamFormValues, toTeamSaveRequest } from './useTeamForm';

const SAVE_FAILED = 'Could not save the team.';
const REMOVE_FAILED = 'Could not remove that member.';
const HAND_OVER_FAILED = 'Could not hand over the captaincy.';
const LEAVE_FAILED = 'Could not leave the team.';

interface TeamManagement {
  pending: PendingTeamAction | null;
  isBusy: boolean;
  actionError: string | null;
  clearActionError: () => void;
  ask: (action: PendingTeamAction) => void;
  cancel: () => void;
  confirm: () => Promise<void>;
  save: (values: TeamFormValues) => Promise<void>;
}

interface TeamManagementInput {
  team: CampaignTeamPage | null;
  /** Replaces the loaded team with what the action returned, so nothing is read back twice. */
  applyTeam: (updated: CampaignTeamPage) => void;
  onSaved: (updated: CampaignTeamPage) => void;
  validate: () => Record<string, string | undefined>;
}

/**
 * Every write the captain screen can make, and what happens after each one. Kept out of the screen so
 * the screen stays composition, and out of the service so navigation and confirmation live together
 * with the action they belong to.
 */
export function useTeamManagement({
  team,
  applyTeam,
  onSaved,
  validate,
}: TeamManagementInput): TeamManagement {
  const navigate = useNavigate();
  const toast = useToast();
  const { isBusy, actionError, clearActionError, run } = useTeamAction();
  const [pending, setPending] = useState<PendingTeamAction | null>(null);

  const save = async (values: TeamFormValues) => {
    if (Object.keys(validate()).length || !team) return;

    const saved = await run(
      () => updateCampaignTeam(team.campaignSlug, team.slug, toTeamSaveRequest(values)),
      SAVE_FAILED,
    );

    if (saved) {
      applyTeam(saved);
      onSaved(saved);
      toast({ description: SAVED_MESSAGE, status: 'success', duration: 4000, isClosable: true });
    }
  };

  const leave = async (current: CampaignTeamPage) => {
    const left = await run(
      () => leaveCampaignTeam(current.campaignSlug, current.slug).then(() => true),
      LEAVE_FAILED,
    );

    if (left) navigate(browseTeamsPath(current.campaignSlug));
  };

  const confirm = async () => {
    if (!pending || !team) return;

    const action = pending;

    // The confirmation stays up until the answer arrives: it is what reports the action is running.
    if (action.kind === 'leave') {
      await leave(team);
      setPending(null);
      return;
    }

    const isRemoval = action.kind === 'remove';
    const call = isRemoval
      ? () => removeCampaignTeamMember(team.campaignSlug, team.slug, action.member.uniqueId)
      : () => handOverCampaignTeamCaptaincy(team.campaignSlug, team.slug, action.member.uniqueId);

    const updated = await run(call, isRemoval ? REMOVE_FAILED : HAND_OVER_FAILED);
    setPending(null);

    if (!updated) return;

    applyTeam(updated);

    // Handing over ends this caller's captaincy, so the screen they are on is no longer theirs.
    if (updated.viewerRole !== 'Captain') {
      navigate(teamPagePath(updated.campaignSlug, updated.slug));
    }
  };

  return {
    pending,
    isBusy,
    actionError,
    clearActionError,
    ask: setPending,
    cancel: () => setPending(null),
    confirm,
    save,
  };
}
