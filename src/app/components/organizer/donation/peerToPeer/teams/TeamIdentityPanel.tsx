import { Badge, Box, Button, Heading, Stack, Text } from '@chakra-ui/react';
import { CampaignTeamPage } from 'app/interface/donationInter/campaignTeamDto';
import {
  CAPTAIN_BADGE,
  LEAVE_LABEL,
  MANAGE_TEAM,
  TEAM_STORY_HEADING,
  membersCount,
} from './teamCopy';

interface TeamIdentityPanelProps {
  team: CampaignTeamPage;
  /** Only the captain is offered management, and only a member is offered a way out. */
  onManage?: () => void;
  onLeave?: () => void;
}

/** The team first, the charity second, and only the actions this particular caller actually has. */
export const TeamIdentityPanel = ({ team, onManage, onLeave }: TeamIdentityPanelProps) => {
  const captain = team.members.find((member) => member.isCaptain);

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
    >
      <Stack gap={4}>
        <Stack gap={2} minW={0}>
          <Heading
            as="h1"
            fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
            color="navy.700"
            _dark={{ color: 'white' }}
          >
            {team.name}
          </Heading>

          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
            {`Fundraising together for ${team.organizerName}`}
          </Text>

          <Stack direction="row" gap={2} flexWrap="wrap">
            <Badge colorScheme="purple" borderRadius="full" px={3} py={1} textTransform="none">
              {team.campaignName}
            </Badge>
            <Badge colorScheme="gray" borderRadius="full" px={3} py={1} textTransform="none">
              {membersCount(team.members.length)}
            </Badge>
            {captain && (
              <Badge colorScheme="gray" borderRadius="full" px={3} py={1} textTransform="none">
                {`${CAPTAIN_BADGE}: ${captain.displayName}`}
              </Badge>
            )}
          </Stack>
        </Stack>

        {team.story && (
          <Stack gap={2}>
            <Heading
              as="h2"
              fontSize={{ base: 'md', md: 'lg' }}
              color="navy.700"
              _dark={{ color: 'white' }}
            >
              {TEAM_STORY_HEADING}
            </Heading>
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="gray.700"
              _dark={{ color: 'gray.200' }}
              whiteSpace="pre-wrap"
            >
              {team.story}
            </Text>
          </Stack>
        )}

        {(onManage || onLeave) && (
          <Stack direction={{ base: 'column', '2sm': 'row' }} gap={3}>
            {onManage && (
              <Button
                onClick={onManage}
                colorScheme="brand"
                variant="outline"
                minH="44px"
                borderRadius="12px"
                cursor="pointer"
                w={{ base: 'full', '2sm': 'auto' }}
              >
                {MANAGE_TEAM}
              </Button>
            )}

            {onLeave && (
              <Button
                onClick={onLeave}
                colorScheme="red"
                variant="outline"
                minH="44px"
                borderRadius="12px"
                cursor="pointer"
                w={{ base: 'full', '2sm': 'auto' }}
              >
                {LEAVE_LABEL}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default TeamIdentityPanel;
