import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack } from '@chakra-ui/react';
import { CampaignTeamSummary } from 'app/interface/donationInter/campaignTeamDto';
import { joinCampaignTeam } from 'app/service/organizer/donation/campaignTeamService';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import PublicPageShell from '../page/PublicPageShell';
import BrowseTeamsHeader from './BrowseTeamsHeader';
import BrowseTeamsNotices from './BrowseTeamsNotices';
import ConfirmActionDialog from './ConfirmActionDialog';
import TeamActionError from './TeamActionError';
import TeamResults from './TeamResults';
import TeamsSkeleton from './TeamsSkeleton';
import {
  BROWSE_LOAD_FAILED_HEADING,
  JOINING_LABEL,
  JOIN_CONFIRM_ACTION,
  JOIN_CONFIRM_BODY,
  RETRY_LABEL,
  joinConfirmTitle,
} from './teamCopy';
import { createTeamPath, teamPagePath } from './teamPaths';
import { useCampaignTeams } from './useCampaignTeams';
import { useTeamAction } from './useTeamAction';

const JOIN_FAILED = 'Could not join the team.';

/**
 * Screen 23. Composition only: the read and its search live in a hook, every panel is presentational,
 * and each state somebody can arrive in - loading, failed, teams switched off, not fundraising yet,
 * already in a team, nothing to show, no search match, and a list - is a designed surface.
 */
export const BrowseTeamsScreen = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const navigate = useNavigate();
  const { browse, search, isLoading, isSearching, loadError, setSearch, reload } =
    useCampaignTeams(campaignSlug);
  const { isBusy, actionError, clearActionError, run } = useTeamAction();
  const [teamToJoin, setTeamToJoin] = useState<CampaignTeamSummary | null>(null);

  const confirmJoin = async () => {
    if (!teamToJoin || !campaignSlug) return;

    const joined = await run(() => joinCampaignTeam(campaignSlug, teamToJoin.slug), JOIN_FAILED);
    setTeamToJoin(null);

    if (joined) {
      navigate(teamPagePath(joined.campaignSlug, joined.slug));
    }
  };

  if (isLoading) {
    return (
      <PublicPageShell>
        <TeamsSkeleton />
      </PublicPageShell>
    );
  }

  if (loadError || !browse) {
    return (
      <PublicPageShell>
        <FundraiserPageNotice
          heading={BROWSE_LOAD_FAILED_HEADING}
          message={loadError}
          onRetry={reload}
          retryLabel={RETRY_LABEL}
        />
      </PublicPageShell>
    );
  }

  const canJoin = browse.areTeamsAllowed && browse.isFundraiser && !browse.myTeamSlug;

  return (
    <PublicPageShell>
      <Stack gap={{ base: 4, md: 6 }}>
        <BrowseTeamsHeader
          browse={browse}
          search={search}
          isSearching={isSearching}
          onSearchChange={setSearch}
          onStartTeam={() => navigate(createTeamPath(browse.campaignSlug))}
          onGoToMyTeam={() => navigate(teamPagePath(browse.campaignSlug, browse.myTeamSlug))}
        />

        {actionError && <TeamActionError message={actionError} onDismiss={clearActionError} />}

        <BrowseTeamsNotices
          browse={browse}
          onSetUpMyPage={() =>
            navigate(`/donation/campaign/${browse.campaignUniqueId}/peer-to-peer/join`)
          }
        />

        <TeamResults
          browse={browse}
          search={search}
          canJoin={canJoin}
          onClearSearch={() => setSearch('')}
          onStartTeam={() => navigate(createTeamPath(browse.campaignSlug))}
          onOpenTeam={(team) => navigate(teamPagePath(browse.campaignSlug, team.slug))}
          onJoinTeam={setTeamToJoin}
        />
      </Stack>

      <ConfirmActionDialog
        isOpen={Boolean(teamToJoin)}
        title={joinConfirmTitle(teamToJoin?.name ?? '')}
        body={JOIN_CONFIRM_BODY}
        confirmLabel={JOIN_CONFIRM_ACTION}
        busyLabel={JOINING_LABEL}
        isBusy={isBusy}
        onConfirm={confirmJoin}
        onCancel={() => setTeamToJoin(null)}
      />
    </PublicPageShell>
  );
};

export default BrowseTeamsScreen;
