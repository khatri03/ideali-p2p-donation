import type { ReactNode } from 'react';
import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import { CampaignTeamMember } from 'app/interface/donationInter/campaignTeamDto';
import TeamMemberRow from './TeamMemberRow';
import { MEMBERS_HEADING, membersCount } from './teamCopy';

interface TeamMembersPanelProps {
  members: CampaignTeamMember[];
  currencySymbol: string;
  onViewPage: (member: CampaignTeamMember) => void;
  /** The captain screen supplies the per-member actions; the public page supplies none. */
  renderActions?: (member: CampaignTeamMember) => ReactNode;
}

/**
 * Everybody in the team with what each of them has raised, so a team total is never a figure nobody can
 * account for. The same panel serves the public page and the captain screen.
 */
export const TeamMembersPanel = ({
  members,
  currencySymbol,
  onViewPage,
  renderActions,
}: TeamMembersPanelProps) => (
  <Box
    bg="white"
    _dark={{ bg: 'navy.700' }}
    borderRadius="16px"
    boxShadow="sm"
    p={{ base: 4, md: 6 }}
  >
    <Stack gap={1} mb={2}>
      <Heading
        as="h2"
        fontSize={{ base: 'md', md: 'lg' }}
        color="navy.700"
        _dark={{ color: 'white' }}
      >
        {MEMBERS_HEADING}
      </Heading>
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
        {membersCount(members.length)}
      </Text>
    </Stack>

    <Stack gap={0}>
      {members.map((member) => (
        <TeamMemberRow
          key={member.uniqueId}
          member={member}
          currencySymbol={currencySymbol}
          onViewPage={() => onViewPage(member)}
          actions={renderActions?.(member)}
        />
      ))}
    </Stack>
  </Box>
);

export default TeamMembersPanel;
