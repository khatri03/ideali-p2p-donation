import { useState, type ReactNode } from 'react';
import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { CampaignTeamMember } from 'app/interface/donationInter/campaignTeamDto';
import TeamMemberRow from './TeamMemberRow';
import {
  MEMBERS_EMPTY,
  MEMBERS_HEADING,
  MEMBERS_VISIBLE_LIMIT,
  SHOW_FEWER_MEMBERS,
  membersCount,
  showAllMembers,
} from './teamCopy';

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
 *
 * A large team is cut to a readable length rather than rendered in full: the donate action sits under
 * this panel, and a team of sixty pushed it off a phone screen entirely. The rest are one press away
 * and no member is unreachable.
 */
export const TeamMembersPanel = ({
  members,
  currencySymbol,
  onViewPage,
  renderActions,
}: TeamMembersPanelProps) => {
  const [isShowingAll, setIsShowingAll] = useState(false);
  const isCut = members.length > MEMBERS_VISIBLE_LIMIT;
  const shown = isCut && !isShowingAll ? members.slice(0, MEMBERS_VISIBLE_LIMIT) : members;

  return (
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

      {members.length === 0 ? (
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }} py={2}>
          {MEMBERS_EMPTY}
        </Text>
      ) : (
        <Stack gap={0}>
          {shown.map((member) => (
            <TeamMemberRow
              key={member.uniqueId}
              member={member}
              currencySymbol={currencySymbol}
              onViewPage={() => onViewPage(member)}
              actions={renderActions?.(member)}
            />
          ))}
        </Stack>
      )}

      {isCut && (
        <Button
          onClick={() => setIsShowingAll((wasShowingAll) => !wasShowingAll)}
          variant="ghost"
          colorScheme="brand"
          size="sm"
          minH="44px"
          borderRadius="12px"
          cursor="pointer"
          mt={3}
          w={{ base: 'full', '2sm': 'auto' }}
        >
          {isShowingAll ? SHOW_FEWER_MEMBERS : showAllMembers(members.length)}
        </Button>
      )}
    </Box>
  );
};

export default TeamMembersPanel;
