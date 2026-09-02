import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, useToast } from '@chakra-ui/react';
import {
  joinCampaignTeam,
  leaveCampaignTeam,
} from 'app/service/organizer/donation/campaignTeamService';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import PublicPageShell from '../page/PublicPageShell';
import { fundraiserDonatePath, fundraiserPagePath } from '../page/FundraiserPage';
import ConfirmActionDialog from './ConfirmActionDialog';
import LiveTeamPage from './LiveTeamPage';
import TeamActionError from './TeamActionError';
import TeamPageSkeleton from './TeamPageSkeleton';
import { leaveWarningFor } from './teamConfirmations';
import {
  JOINING_LABEL,
  JOIN_CONFIRM_ACTION,
  JOIN_CONFIRM_BODY,
  JOIN_FAILED,
  LEAVE_CONFIRM_ACTION,
  LEAVE_CONFIRM_BODY,
  LEAVE_FAILED,
  LEAVING_LABEL,
  RETRY_LABEL,
  TEAM_NOT_FOUND_GUIDANCE,
  TEAM_NOT_FOUND_HEADING,
  joinConfirmTitle,
  joinedTeamMessage,
  leaveConfirmTitle,
  leftTeamMessage,
} from './teamCopy';
import { browseTeamsPath, teamMembersPath, teamPagePath } from './teamPaths';
import { useTeamAction } from './useTeamAction';
import { useTeamPage } from './useTeamPage';

/**
 * Screen 05. Composition only. A team whose last member left answers "not found", and that is rendered
 * as the same designed surface as a mistyped address rather than as an error - the outcome is defined,
 * so the screen showing it is designed too.
 */
export const TeamPageScreen = () => {
  const { campaignSlug, teamSlug } = useParams<{ campaignSlug: string; teamSlug: string }>();
  const navigate = useNavigate();
  const { team, isLoading, loadError, applyTeam, reload } = useTeamPage(campaignSlug, teamSlug);
  const { isBusy, actionError, clearActionError, run } = useTeamAction();
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const toast = useToast();

  // Both outcomes move the reader: joining rewrites the page under them and leaving takes them off it
  // altogether. Neither is allowed to happen silently.
  const announce = (message: string) =>
    toast({ title: message, status: 'success', duration: 5000, isClosable: true });

  const confirmJoin = async () => {
    if (!team) return;

    const joined = await run(() => joinCampaignTeam(team.campaignSlug, team.slug), JOIN_FAILED);
    setIsJoinOpen(false);

    // The server answers with the team as it now stands, so the page becomes a member's page without
    // a second read and without the join panel lingering over a team it has just been added to.
    if (joined) {
      applyTeam(joined);
      announce(joinedTeamMessage(team.name));
    }
  };

  const confirmLeave = async () => {
    if (!team) return;

    const left = await run(
      () => leaveCampaignTeam(team.campaignSlug, team.slug).then(() => true),
      LEAVE_FAILED,
    );
    setIsLeaveOpen(false);

    if (left) {
      announce(leftTeamMessage(team.name));
      navigate(browseTeamsPath(team.campaignSlug));
    }
  };

  if (isLoading) {
    return (
      <PublicPageShell>
        <TeamPageSkeleton />
      </PublicPageShell>
    );
  }

  if (loadError || !team) {
    return (
      <PublicPageShell>
        <FundraiserPageNotice
          heading={TEAM_NOT_FOUND_HEADING}
          message={TEAM_NOT_FOUND_GUIDANCE}
          onRetry={reload}
          retryLabel={RETRY_LABEL}
        />
      </PublicPageShell>
    );
  }

  const isMember = team.viewerRole === 'Member' || team.viewerRole === 'Captain';

  return (
    <PublicPageShell>
      <Stack gap={{ base: 4, md: 6 }}>
        {actionError && <TeamActionError message={actionError} onDismiss={clearActionError} />}

        <LiveTeamPage
          team={team}
          onManage={
            team.viewerRole === 'Captain'
              ? () => navigate(teamMembersPath(team.campaignSlug, team.slug))
              : undefined
          }
          onLeave={isMember ? () => setIsLeaveOpen(true) : undefined}
          onJoin={() => setIsJoinOpen(true)}
          onSetUpMyPage={() => navigate(fundraiserJoinPath(team.campaignUniqueId))}
          onGoToMyTeam={(myTeamSlug) =>
            navigate(teamPagePath(team.campaignSlug, myTeamSlug))
          }
          onViewMember={(member) =>
            navigate(fundraiserPagePath(team.campaignSlug, member.fundraiserSlug))
          }
          onDonateToMember={(member) =>
            navigate(fundraiserDonatePath(team.campaignSlug, member.fundraiserSlug))
          }
        />
      </Stack>

      <ConfirmActionDialog
        isOpen={isJoinOpen}
        title={joinConfirmTitle(team.name)}
        body={JOIN_CONFIRM_BODY}
        confirmLabel={JOIN_CONFIRM_ACTION}
        busyLabel={JOINING_LABEL}
        isBusy={isBusy}
        onConfirm={confirmJoin}
        onCancel={() => setIsJoinOpen(false)}
      />

      <ConfirmActionDialog
        isOpen={isLeaveOpen}
        title={leaveConfirmTitle(team.name)}
        body={LEAVE_CONFIRM_BODY}
        warning={leaveWarningFor(team)}
        confirmLabel={LEAVE_CONFIRM_ACTION}
        busyLabel={LEAVING_LABEL}
        isBusy={isBusy}
        isDestructive
        onConfirm={confirmLeave}
        onCancel={() => setIsLeaveOpen(false)}
      />
    </PublicPageShell>
  );
};

export default TeamPageScreen;
