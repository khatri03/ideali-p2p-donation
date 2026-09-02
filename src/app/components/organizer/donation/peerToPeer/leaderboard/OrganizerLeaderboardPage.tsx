import { Link as RouterLink, useParams } from 'react-router-dom';
import { Button, Flex, Stack } from '@chakra-ui/react';
import { MdOpenInNew } from 'react-icons/md';
import FundraiserPageNotice from '../page/FundraiserPageNotice';
import ModerationShell from '../moderation/ModerationShell';
import { peerToPeerSettingsPath } from '../moderation/moderationPaths';
import { usePeerToPeerSettings } from '../usePeerToPeerSettings';
import LeaderboardBody from './LeaderboardBody';
import LeaderboardSkeleton from './LeaderboardSkeleton';
import {
  HIDDEN_ACTION_LABEL,
  HIDDEN_GUIDANCE,
  HIDDEN_HEADING,
  LEADERBOARD_HEADING,
  NOT_FOUND_GUIDANCE,
  NOT_FOUND_HEADING,
  RETRY_LABEL,
  VIEW_PUBLIC_BOARD_LABEL,
} from './leaderboardCopy';
import { leaderboardPath } from './leaderboardPaths';

/**
 * The charity's own view of the standings. Identical board to the one supporters open, inside the
 * oversight frame, so reading it never costs the charity its navigation. The campaign's settings are
 * read first because the board is addressed by slug while every oversight screen is addressed by
 * unique id, and because a hidden board has to say so rather than fail as "not found".
 */
export const OrganizerLeaderboardPage = () => {
  const { campaignUniqueId } = useParams<{ campaignUniqueId: string }>();
  const { settings, isLoading, loadError, reload } = usePeerToPeerSettings(campaignUniqueId ?? '');

  const isHidden = settings?.leaderboardVisibility === 'Hidden';
  const isPublic = settings?.leaderboardVisibility === 'Public';

  const body = () => {
    if (isLoading) {
      return <LeaderboardSkeleton />;
    }

    if (loadError || !settings?.peerToPeerSlug) {
      return (
        <FundraiserPageNotice
          heading={NOT_FOUND_HEADING}
          message={loadError || NOT_FOUND_GUIDANCE}
          headingLevel="h2"
          onRetry={reload}
          retryLabel={RETRY_LABEL}
        />
      );
    }

    if (isHidden) {
      return (
        <FundraiserPageNotice
          heading={HIDDEN_HEADING}
          message={HIDDEN_GUIDANCE}
          headingLevel="h2"
          action={
            <Button
              as={RouterLink}
              to={peerToPeerSettingsPath(campaignUniqueId ?? '')}
              colorScheme="brand"
              minH="44px"
              borderRadius="12px"
              w={{ base: 'full', md: 'auto' }}
              sx={{ cursor: 'pointer' }}
            >
              {HIDDEN_ACTION_LABEL}
            </Button>
          }
        />
      );
    }

    return (
      <Stack gap={{ base: 4, md: 5 }}>
        {isPublic && (
          <Flex justify={{ base: 'stretch', md: 'flex-end' }}>
            <Button
              as={RouterLink}
              to={leaderboardPath(settings.peerToPeerSlug)}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              colorScheme="brand"
              leftIcon={<MdOpenInNew aria-hidden="true" />}
              minH="44px"
              borderRadius="12px"
              w={{ base: 'full', md: 'auto' }}
              sx={{ cursor: 'pointer' }}
            >
              {VIEW_PUBLIC_BOARD_LABEL}
            </Button>
          </Flex>
        )}

        <LeaderboardBody campaignSlug={settings.peerToPeerSlug} headingLevel="h2" />
      </Stack>
    );
  };

  return (
    <ModerationShell
      campaignUniqueId={campaignUniqueId ?? ''}
      campaignName={settings?.campaignName}
      heading={LEADERBOARD_HEADING}
    >
      {body()}
    </ModerationShell>
  );
};

export default OrganizerLeaderboardPage;
