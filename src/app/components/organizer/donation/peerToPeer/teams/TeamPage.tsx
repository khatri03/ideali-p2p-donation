import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack } from '@chakra-ui/react';
import { leaveCampaignTeam } from 'app/service/organizer/donation/campaignTeamService';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import PublicPageShell from '../page/PublicPageShell';
import { fundraiserDonatePath, fundraiserPagePath } from '../page/FundraiserPage';
import ConfirmActionDialog from './ConfirmActionDialog';
import LiveTeamPage from './LiveTeamPage';
import TeamActionError from './TeamActionError';
import TeamPageSkeleton from './TeamPageSkeleton';
import { leaveWarningFor } from './teamConfirmations';
import {
  LEAVE_CONFIRM_ACTION,
  LEAVE_CONFIRM_BODY,
  LEAVING_LABEL,
  RETRY_LABEL,
  TEAM_NOT_FOUND_GUIDANCE,
  TEAM_NOT_FOUND_HEADING,
  leaveConfirmTitle,
} from './teamCopy';
import { browseTeamsPath, teamMembersPath } from './teamPaths';
import { useTeamAction } from './useTeamAction';
import { useTeamPage } from './useTeamPage';

const LEAVE_FAILED = 'Could not leave the team.';

/**
 * Screen 05. Composition only. A team whose last member left answers "not found", and that is rendered
 * as the same designed surface as a mistyped address rather than as an error - the outcome is defined,
 * so the screen showing it is designed too.
 */
export const TeamPageScreen = () => {
  const { campaignSlug, teamSlug } = useParams<{ campaignSlug: string; teamSlug: string }>();
  const navigate = useNavigate();
  const { team, isLoading, loadError, reload } = useTeamPage(campaignSlug, teamSlug);
  const { isBusy, actionError, clearActionError, run } = useTeamAction();
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  const confirmLeave = async () => {
    if (!team) return;

    const left = await run(
      () => leaveCampaignTeam(team.campaignSlug, team.slug).then(() => true),
      LEAVE_FAILED,
    );
    setIsLeaveOpen(false);

    if (left) {
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
          onViewMember={(member) =>
            navigate(fundraiserPagePath(team.campaignSlug, member.fundraiserSlug))
          }
          onDonateToMember={(member) =>
            navigate(fundraiserDonatePath(team.campaignSlug, member.fundraiserSlug))
          }
        />
      </Stack>

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
