import { useNavigate, useParams } from 'react-router-dom';
import { Button, Stack, Text } from '@chakra-ui/react';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import PublicPageShell from '../page/PublicPageShell';
import { fundraiserPagePath } from '../page/FundraiserPage';
import ConfirmActionDialog from './ConfirmActionDialog';
import EditTeamPanel from './EditTeamPanel';
import ManageTeamHeader from './ManageTeamHeader';
import MemberCaptainActions from './MemberCaptainActions';
import TeamActionError from './TeamActionError';
import TeamMembersPanel from './TeamMembersPanel';
import TeamPageSkeleton from './TeamPageSkeleton';
import { describeConfirmation } from './teamConfirmations';
import {
  BACK_TO_TEAM,
  CAPTAIN_ONLY_GUIDANCE,
  CAPTAIN_ONLY_HEADING,
  ONLY_MEMBER_NOTE,
  RETRY_LABEL,
  TEAM_NOT_FOUND_GUIDANCE,
  TEAM_NOT_FOUND_HEADING,
} from './teamCopy';
import { teamPagePath } from './teamPaths';
import { useTeamPage } from './useTeamPage';
import { useTeamForm } from './useTeamForm';
import { useTeamManagement } from './useTeamManagement';

/**
 * Screen 15. The captain manages who is in the team and what donors read. Hiding these controls from a
 * member is presentation only - the same actions are refused by the server against captaincy of this
 * exact team - so somebody who reaches this address without being the captain gets a designed refusal
 * rather than a broken screen.
 */
export const TeamMembersScreen = () => {
  const { campaignSlug, teamSlug } = useParams<{ campaignSlug: string; teamSlug: string }>();
  const navigate = useNavigate();
  const { team, isLoading, loadError, applyTeam, reload } = useTeamPage(campaignSlug, teamSlug);
  const { values, errors, hasUnsavedChanges, setField, validate, reset } = useTeamForm(team);
  const management = useTeamManagement({ team, applyTeam, onSaved: reset, validate });

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

  const backToTeam = () => navigate(teamPagePath(team.campaignSlug, team.slug));

  if (team.viewerRole !== 'Captain') {
    return (
      <PublicPageShell>
        <FundraiserPageNotice
          heading={CAPTAIN_ONLY_HEADING}
          message={CAPTAIN_ONLY_GUIDANCE}
          action={
            <Button
              onClick={backToTeam}
              colorScheme="brand"
              minH="44px"
              borderRadius="12px"
              cursor="pointer"
              w={{ base: 'full', md: 'auto' }}
            >
              {BACK_TO_TEAM}
            </Button>
          }
        />
      </PublicPageShell>
    );
  }

  const confirmation = management.pending
    ? describeConfirmation(management.pending, team)
    : null;

  return (
    <PublicPageShell>
      <Stack gap={{ base: 4, md: 6 }}>
        <ManageTeamHeader
          teamName={team.name}
          onBack={backToTeam}
          onLeave={() => management.ask({ kind: 'leave' })}
        />

        {management.actionError && (
          <TeamActionError
            message={management.actionError}
            onDismiss={management.clearActionError}
          />
        )}

        <TeamMembersPanel
          members={team.members}
          currencySymbol={team.currencySymbol}
          onViewPage={(member) =>
            navigate(fundraiserPagePath(team.campaignSlug, member.fundraiserSlug))
          }
          renderActions={(member) => (
            <MemberCaptainActions
              member={member}
              isBusy={management.isBusy}
              onRemove={() => management.ask({ kind: 'remove', member })}
              onHandOver={() => management.ask({ kind: 'handOver', member })}
            />
          )}
        />

        {team.members.length === 1 && (
          <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
            {ONLY_MEMBER_NOTE}
          </Text>
        )}

        <EditTeamPanel
          team={team}
          values={values}
          errors={errors}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={management.isBusy}
          onChange={setField}
          onSave={() => management.save(values)}
        />
      </Stack>

      {confirmation && (
        <ConfirmActionDialog
          isOpen
          title={confirmation.title}
          body={confirmation.body}
          warning={confirmation.warning}
          confirmLabel={confirmation.confirmLabel}
          busyLabel={confirmation.busyLabel}
          isBusy={management.isBusy}
          isDestructive={confirmation.isDestructive}
          onConfirm={management.confirm}
          onCancel={management.cancel}
        />
      )}
    </PublicPageShell>
  );
};

export default TeamMembersScreen;
