import { CampaignTeamMember, CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import {
  HAND_OVER_CONFIRM_ACTION,
  LEAVE_CAPTAIN_WARNING,
  LEAVE_CONFIRM_ACTION,
  LEAVE_CONFIRM_BODY,
  LEAVE_LAST_MEMBER_WARNING,
  LEAVING_LABEL,
  REMOVE_CONFIRM_ACTION,
  SAVING_LABEL,
  handOverConfirmBody,
  handOverConfirmTitle,
  leaveConfirmTitle,
  removeConfirmBody,
  removeConfirmTitle,
} from './teamCopy';

export type PendingTeamAction =
  | { kind: 'remove'; member: CampaignTeamMember }
  | { kind: 'handOver'; member: CampaignTeamMember }
  | { kind: 'leave' };

export interface TeamConfirmation {
  title: string;
  body: string;
  warning?: string;
  confirmLabel: string;
  busyLabel: string;
  isDestructive: boolean;
}

/** The two cases where leaving changes more than one person's standing, said before it is done. */
export const leaveWarningFor = (team: CampaignTeamPage): string | undefined => {
  if (team.members.length === 1) {
    return LEAVE_LAST_MEMBER_WARNING;
  }

  return team.viewerRole === 'Captain' ? LEAVE_CAPTAIN_WARNING : undefined;
};

/**
 * What each destructive action says before it is done. Every one of them names the person it affects
 * and states what happens to money already raised, so nobody agrees to something they did not read.
 * Kept apart from the screen so the wording is testable on its own.
 */
export const describeConfirmation = (
  pending: PendingTeamAction,
  team: CampaignTeamPage,
): TeamConfirmation => {
  if (pending.kind === 'remove') {
    return {
      title: removeConfirmTitle(pending.member.displayName),
      body: removeConfirmBody(pending.member.displayName),
      confirmLabel: REMOVE_CONFIRM_ACTION,
      busyLabel: SAVING_LABEL,
      isDestructive: true,
    };
  }

  if (pending.kind === 'handOver') {
    return {
      title: handOverConfirmTitle(pending.member.displayName),
      body: handOverConfirmBody(pending.member.displayName),
      confirmLabel: HAND_OVER_CONFIRM_ACTION,
      busyLabel: SAVING_LABEL,
      isDestructive: false,
    };
  }

  return {
    title: leaveConfirmTitle(team.name),
    body: LEAVE_CONFIRM_BODY,
    warning: leaveWarningFor(team),
    confirmLabel: LEAVE_CONFIRM_ACTION,
    busyLabel: LEAVING_LABEL,
    isDestructive: true,
  };
};
