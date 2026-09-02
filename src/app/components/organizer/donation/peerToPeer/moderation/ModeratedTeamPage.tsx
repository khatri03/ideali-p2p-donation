import { ReactNode, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Flex, SimpleGrid, Stack, Text, useToast } from '@chakra-ui/react';
import { MdOpenInNew } from 'react-icons/md';
import {
  getModeratedTeam,
  moderateTeam,
} from 'app/service/organizer/donation/peerToPeerModerationService';
import {
  ModeratedTeamDetail,
  ModerationAction,
} from 'app/interface/donationInter/peerToPeerModerationDto';
import { formatMoney } from '../page/money';
import { teamPagePath } from '../teams/teamPaths';
import {
  CAPTAIN_COLUMN,
  CAPTAIN_TAG,
  GOAL_COLUMN,
  MEMBERS_COLUMN,
  MEMBERS_EMPTY,
  MEMBERS_HEADING,
  NO_GOAL,
  NO_PUBLIC_ADDRESS,
  NO_STORY,
  OPEN_TEAM_PAGE,
  RAISED_COLUMN,
  STARTED_COLUMN,
  STORY_HEADING,
  actionDoneMessage,
  teamActionCopy,
} from './moderationCopy';
import ModerationActionDialog from './ModerationActionDialog';
import ModerationActionsBar, { teamChoices } from './ModerationActionsBar';
import ModerationHistoryPanel from './ModerationHistoryPanel';
import ModerationShell from './ModerationShell';
import { ModerationError, ModerationSkeleton, TeamVisibilityBadge } from './ModerationStates';
import { useModerationAction } from './useModerationAction';
import { useModerationDetail } from './useModerationDetail';

const formatDate = (isoUtc: string) => {
  const when = new Date(isoUtc);

  return Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString();
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <Stack gap={0} minW={0}>
    <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} fontWeight="600">
      {label}
    </Text>
    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700">
      {value}
    </Text>
  </Stack>
);

const Panel = ({ children }: { children: ReactNode }) => (
  <Stack
    gap={3}
    p={{ base: 4, md: 5 }}
    borderWidth="1px"
    borderColor="secondaryGray.200"
    borderRadius="16px"
    bg="white"
    _dark={{ bg: 'navy.700', borderColor: 'whiteAlpha.300' }}
  >
    {children}
  </Stack>
);

/**
 * Screen 17. One team as the charity reviews it: who is in it, what each of them raised, and the one
 * decision a team can take. Hiding a team never touches the pages inside it.
 */
export const ModeratedTeamPage = () => {
  const { campaignUniqueId, teamUniqueId } = useParams<{
    campaignUniqueId: string;
    teamUniqueId: string;
  }>();
  const toast = useToast();
  const campaignId = campaignUniqueId ?? '';
  const teamId = teamUniqueId ?? '';

  const read = useCallback(getModeratedTeam, []);

  const { detail, isLoading, error, reload } = useModerationDetail<ModeratedTeamDetail>(
    campaignId,
    teamId,
    read,
  );

  const send = useCallback(
    (subjectUniqueId: string, action: ModerationAction, reason?: string) =>
      moderateTeam(campaignId, subjectUniqueId, { action, reason }),
    [campaignId],
  );

  const moderation = useModerationAction(send);

  const handleConfirm = async () => {
    const pending = moderation.pending;

    if (!pending) {
      return;
    }

    const failure = await moderation.confirm();

    if (failure) {
      toast({
        title: 'Not saved',
        description: failure,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: actionDoneMessage(pending.action, pending.subjectName),
      status: 'success',
      duration: 4000,
      isClosable: true,
    });

    reload();
  };

  const publicPath =
    detail?.campaignSlug && !detail.isHidden ? teamPagePath(detail.campaignSlug, detail.slug) : null;

  const dialogCopy = moderation.pending
    ? teamActionCopy(moderation.pending.action, moderation.pending.subjectName)
    : null;

  return (
    <ModerationShell
      campaignUniqueId={campaignId}
      campaignName={detail?.campaignName}
      heading={detail?.name ?? 'Team'}
    >
      <Stack gap={{ base: 4, md: 5 }}>
        {error && <ModerationError message={error} onRetry={reload} />}

        {isLoading && !detail && <ModerationSkeleton rows={3} />}

        {detail && (
          <>
            <Panel>
              <Flex justify="space-between" gap={3} wrap="wrap" align="flex-start">
                <TeamVisibilityBadge isHidden={detail.isHidden} />
                {publicPath ? (
                  <Button
                    as="a"
                    href={publicPath}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="ghost"
                    minH="44px"
                    rightIcon={<MdOpenInNew />}
                    sx={{ cursor: 'pointer' }}
                  >
                    {OPEN_TEAM_PAGE}
                  </Button>
                ) : (
                  !detail.isHidden && (
                    <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} maxW="320px">
                      {NO_PUBLIC_ADDRESS}
                    </Text>
                  )
                )}
              </Flex>

              <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 3, md: 4 }}>
                <Fact
                  label={RAISED_COLUMN}
                  value={formatMoney(detail.raisedAmount, detail.currencySymbol)}
                />
                <Fact label={MEMBERS_COLUMN} value={String(detail.members.length)} />
                <Fact
                  label={GOAL_COLUMN}
                  value={
                    detail.teamGoal ? formatMoney(detail.teamGoal, detail.currencySymbol) : NO_GOAL
                  }
                />
                <Fact label={CAPTAIN_COLUMN} value={detail.captainName} />
              </SimpleGrid>

              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
                {STARTED_COLUMN}: {formatDate(detail.startedOnUtc)}
              </Text>

              <ModerationActionsBar
                choices={teamChoices(detail.isHidden)}
                isBusy={moderation.isSaving}
                onChoose={(action) =>
                  moderation.ask({
                    action,
                    subjectUniqueId: detail.uniqueId,
                    subjectName: detail.name,
                  })
                }
              />
            </Panel>

            <Panel>
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700">
                {STORY_HEADING}
              </Text>
              <Text fontSize="sm" whiteSpace="pre-wrap" color="secondaryGray.700">
                {detail.story?.trim() || NO_STORY}
              </Text>
            </Panel>

            <Panel>
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700">
                {MEMBERS_HEADING}
              </Text>
              {detail.members.length === 0 ? (
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                  {MEMBERS_EMPTY}
                </Text>
              ) : (
                <Stack as="ul" gap={2} listStyleType="none" m={0} p={0}>
                  {detail.members.map((member) => (
                    <Flex
                      as="li"
                      key={member.fundraiserUniqueId}
                      justify="space-between"
                      gap={3}
                      align="center"
                    >
                      <Flex gap={2} align="center" minW={0}>
                        <Text fontSize="sm">{member.displayName}</Text>
                        {member.isCaptain && (
                          <Badge colorScheme="purple" borderRadius="8px" fontSize="xs">
                            {CAPTAIN_TAG}
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize="sm" fontWeight="600" whiteSpace="nowrap">
                        {formatMoney(member.raisedAmount, detail.currencySymbol)}
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Panel>

            <ModerationHistoryPanel history={detail.history} />
          </>
        )}
      </Stack>

      {dialogCopy && (
        <ModerationActionDialog
          isOpen
          title={dialogCopy.title}
          body={dialogCopy.body}
          confirmLabel={dialogCopy.confirmLabel}
          busyLabel={dialogCopy.busyLabel}
          isDestructive={dialogCopy.isDestructive}
          isBusy={moderation.isSaving}
          reason={moderation.reason}
          reasonError={moderation.reasonError}
          onReasonChange={moderation.setReason}
          onConfirm={handleConfirm}
          onCancel={moderation.cancel}
        />
      )}
    </ModerationShell>
  );
};

export default ModeratedTeamPage;
