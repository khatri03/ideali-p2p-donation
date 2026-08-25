import { useState } from 'react';
import { SimpleGrid, Stack } from '@chakra-ui/react';
import { CampaignTeamMember, CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import LeaderboardLink from '../leaderboard/LeaderboardLink';
import SharePanel from '../page/SharePanel';
import { useSocialPreview } from '../page/useSocialPreview';
import ChooseMemberModal from './ChooseMemberModal';
import TeamIdentityPanel from './TeamIdentityPanel';
import TeamMembersPanel from './TeamMembersPanel';
import TeamProgressPanel from './TeamProgressPanel';
import { shareHeading } from './teamCopy';
import { teamPagePath } from './teamPaths';

interface LiveTeamPageProps {
  team: CampaignTeamPage;
  onManage?: () => void;
  onLeave?: () => void;
  onViewMember: (member: CampaignTeamMember) => void;
  onDonateToMember: (member: CampaignTeamMember) => void;
}

/**
 * A team that exists, laid out. The donate action asks who to support rather than taking money itself:
 * every gift belongs to one fundraiser and is counted once towards the team, so no second money path
 * is created here.
 */
export const LiveTeamPage = ({
  team,
  onManage,
  onLeave,
  onViewMember,
  onDonateToMember,
}: LiveTeamPageProps) => {
  const [isChoosingMember, setIsChoosingMember] = useState(false);
  const shareUrl = `${window.location.origin}${teamPagePath(team.campaignSlug, team.slug)}`;

  useSocialPreview({
    title: `${team.name} is fundraising for ${team.organizerName}`,
    description: team.story?.slice(0, 200) ?? `Support ${team.campaignName}.`,
    url: shareUrl,
  });

  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 4, md: 6 }} alignItems="start">
        <Stack gridColumn={{ lg: 'span 2' }} gap={{ base: 4, md: 6 }} minW={0}>
          <TeamIdentityPanel team={team} onManage={onManage} onLeave={onLeave} />

          <TeamMembersPanel
            members={team.members}
            currencySymbol={team.currencySymbol}
            onViewPage={onViewMember}
          />
        </Stack>

        <Stack gap={{ base: 4, md: 6 }} minW={0}>
          <TeamProgressPanel
            organizerName={team.organizerName}
            raisedAmount={team.raisedAmount}
            teamGoal={team.teamGoal}
            donorCount={team.donorCount}
            memberCount={team.members.length}
            currencySymbol={team.currencySymbol}
            isCampaignOpen={team.isCampaignOpen}
            onDonate={() => setIsChoosingMember(true)}
          />

          <SharePanel
            displayName={team.name}
            heading={shareHeading(team.name)}
            shareUrl={shareUrl}
          />

          <LeaderboardLink
            campaignSlug={team.campaignSlug}
            isReachable={team.isLeaderboardPublished}
          />
        </Stack>
      </SimpleGrid>

      <ChooseMemberModal
        isOpen={isChoosingMember}
        members={team.members}
        currencySymbol={team.currencySymbol}
        onChoose={(member) => {
          setIsChoosingMember(false);
          onDonateToMember(member);
        }}
        onClose={() => setIsChoosingMember(false)}
      />
    </>
  );
};

export default LiveTeamPage;
