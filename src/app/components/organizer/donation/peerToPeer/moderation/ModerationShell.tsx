import { ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { MdArrowBack } from 'react-icons/md';
import {
  BACK_LABEL,
  EMAILS_TAB,
  FUNDRAISERS_TAB,
  INVITATIONS_TAB,
  OVERSIGHT_HEADING,
  SETTINGS_TAB,
  TEAMS_TAB,
} from './moderationCopy';
import {
  emailTemplatesPath,
  invitationsPath,
  moderatedFundraisersPath,
  moderatedTeamsPath,
  peerToPeerSettingsPath,
} from './moderationPaths';

interface ModerationShellProps {
  campaignUniqueId: string;
  campaignName?: string;
  heading?: string;
  children: ReactNode;
}

interface TabLinkProps {
  to: string;
  label: string;
  isActive: boolean;
}

const TabLink = ({ to, label, isActive }: TabLinkProps) => (
  <Button
    as={RouterLink}
    to={to}
    size="sm"
    minH="44px"
    px={4}
    variant={isActive ? 'solid' : 'ghost'}
    colorScheme={isActive ? 'brand' : 'gray'}
    aria-current={isActive ? 'page' : undefined}
    sx={{ cursor: 'pointer' }}
  >
    {label}
  </Button>
);

/**
 * The frame every oversight screen sits in: one heading, one campaign name, and the three surfaces a
 * charity moves between. Written once so the tabs cannot disagree about which one is open.
 */
export const ModerationShell = ({
  campaignUniqueId,
  campaignName,
  heading = OVERSIGHT_HEADING,
  children,
}: ModerationShellProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const fundraisersPath = moderatedFundraisersPath(campaignUniqueId);
  const teamsPath = moderatedTeamsPath(campaignUniqueId);
  const invitesPath = invitationsPath(campaignUniqueId);
  const emailsPath = emailTemplatesPath(campaignUniqueId);

  return (
    <Box
      as="main"
      maxW="1200px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      pt={{ base: '100px', md: '80px' }}
      pb={10}
      w="100%"
    >
      <Stack gap={{ base: 4, md: 5 }}>
        <Flex align={{ base: 'stretch', md: 'center' }} gap={3} wrap="wrap">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<MdArrowBack />}
            minH="44px"
            alignSelf={{ base: 'flex-start', md: 'center' }}
            onClick={() => navigate(-1)}
            sx={{ cursor: 'pointer' }}
          >
            {BACK_LABEL}
          </Button>
          <Stack gap={1} minW={0}>
            <Heading as="h1" fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}>
              {heading}
            </Heading>
            {campaignName && (
              <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" _dark={{ color: 'gray.300' }}>
                Campaign:{' '}
                <Text
                  as="span"
                  fontWeight="600"
                  color="secondaryGray.900"
                  _dark={{ color: 'white' }}
                >
                  {campaignName}
                </Text>
              </Text>
            )}
          </Stack>
        </Flex>

        <Flex as="nav" aria-label="Supporter fundraising sections" gap={2} wrap="wrap">
          <TabLink
            to={peerToPeerSettingsPath(campaignUniqueId)}
            label={SETTINGS_TAB}
            isActive={pathname === peerToPeerSettingsPath(campaignUniqueId)}
          />
          <TabLink
            to={fundraisersPath}
            label={FUNDRAISERS_TAB}
            isActive={pathname.startsWith(fundraisersPath)}
          />
          <TabLink to={teamsPath} label={TEAMS_TAB} isActive={pathname.startsWith(teamsPath)} />
          <TabLink
            to={invitesPath}
            label={INVITATIONS_TAB}
            isActive={pathname.startsWith(invitesPath)}
          />
          <TabLink to={emailsPath} label={EMAILS_TAB} isActive={pathname.startsWith(emailsPath)} />
        </Flex>

        {children}
      </Stack>
    </Box>
  );
};

export default ModerationShell;
