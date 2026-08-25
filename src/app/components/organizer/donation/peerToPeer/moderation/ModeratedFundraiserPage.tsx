import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { MdOpenInNew } from 'react-icons/md';
import {
  getModeratedFundraiser,
  moderateFundraiser,
} from 'app/service/organizer/donation/peerToPeerModerationService';
import {
  ModeratedFundraiserDetail,
  ModerationAction,
} from 'app/interface/donationInter/peerToPeerModerationDto';
import { formatMoney } from '../page/money';
import { fundraiserPagePath } from '../page/FundraiserPage';
import {
  DONORS_COLUMN,
  DONORS_EMPTY,
  DONORS_HEADING,
  GOAL_COLUMN,
  NO_GOAL,
  NO_PUBLIC_ADDRESS,
  NO_STORY,
  NO_TEAM,
  OPEN_PUBLIC_PAGE,
  RAISED_COLUMN,
  STARTED_COLUMN,
  STORY_HEADING,
  TEAM_COLUMN,
  actionDoneMessage,
  fundraiserActionCopy,
} from './moderationCopy';
import ModerationActionDialog from './ModerationActionDialog';
import ModerationActionsBar, { fundraiserActionsFor } from './ModerationActionsBar';
import ModerationHistoryPanel from './ModerationHistoryPanel';
import ModerationShell from './ModerationShell';
import {
  FundraiserStatusBadge,
  ModerationError,
  ModerationSkeleton,
} from './ModerationStates';
import { useModerationAction } from './useModerationAction';
import { useModerationDetail } from './useModerationDetail';

const formatDate = (isoUtc: string) => {
  const when = new Date(isoUtc);

  return Number.isNaN(when.getTime()) ? '' : when.toLocaleDateString();
};

interface FactProps {
  label: string;
  value: string;
}

const Fact = ({ label, value }: FactProps) => (
  <Stack gap={0} minW={0}>
    <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} fontWeight="600">
      {label}
    </Text>
    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700">
      {value}
    </Text>
  </Stack>
);

const Panel = ({ children }: { children: React.ReactNode }) => (
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
 * Screen 18. One supporter page as the charity reviews it, with every figure taken from the same
 * definition the supporter's own page uses, and the decisions that page is in a state to accept.
 */
export const ModeratedFundraiserPage = () => {
  const { campaignUniqueId, fundraiserUniqueId } = useParams<{
    campaignUniqueId: string;
    fundraiserUniqueId: string;
  }>();
  const toast = useToast();
  const campaignId = campaignUniqueId ?? '';
  const fundraiserId = fundraiserUniqueId ?? '';

  const read = useCallback(getModeratedFundraiser, []);

  const { detail, isLoading, error, reload } = useModerationDetail<ModeratedFundraiserDetail>(
    campaignId,
    fundraiserId,
    read,
  );

  const send = useCallback(
    (subjectUniqueId: string, action: ModerationAction, reason?: string) =>
      moderateFundraiser(campaignId, subjectUniqueId, { action, reason }),
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

  const publicPath = detail?.campaignSlug
    ? fundraiserPagePath(detail.campaignSlug, detail.slug)
    : null;

  const dialogCopy = moderation.pending
    ? fundraiserActionCopy(moderation.pending.action, moderation.pending.subjectName)
    : null;

  return (
    <ModerationShell
      campaignUniqueId={campaignId}
      campaignName={detail?.campaignName}
      heading={detail?.displayName ?? 'Fundraising page'}
    >
      <Stack gap={{ base: 4, md: 5 }}>
        {error && <ModerationError message={error} onRetry={reload} />}

        {isLoading && !detail && <ModerationSkeleton rows={3} />}

        {detail && (
          <>
            <Panel>
              <Flex justify="space-between" gap={3} wrap="wrap" align="flex-start">
                <FundraiserStatusBadge status={detail.currentStatus} />
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
                    {OPEN_PUBLIC_PAGE}
                  </Button>
                ) : (
                  <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }} maxW="320px">
                    {NO_PUBLIC_ADDRESS}
                  </Text>
                )}
              </Flex>

              <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 3, md: 4 }}>
                <Fact
                  label={RAISED_COLUMN}
                  value={formatMoney(detail.raisedAmount, detail.currencySymbol)}
                />
                <Fact label={DONORS_COLUMN} value={String(detail.donorCount)} />
                <Fact
                  label={GOAL_COLUMN}
                  value={detail.goal ? formatMoney(detail.goal, detail.currencySymbol) : NO_GOAL}
                />
                <Fact label={TEAM_COLUMN} value={detail.teamName ?? NO_TEAM} />
              </SimpleGrid>

              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
                {STARTED_COLUMN}: {formatDate(detail.startedOnUtc)}
              </Text>

              <ModerationActionsBar
                actions={fundraiserActionsFor(detail.currentStatus)}
                isBusy={moderation.isSaving}
                onChoose={(action) =>
                  moderation.ask({
                    action,
                    subjectUniqueId: detail.uniqueId,
                    subjectName: detail.displayName,
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
                {DONORS_HEADING}
              </Text>
              {detail.recentSupporters.length === 0 ? (
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                  {DONORS_EMPTY}
                </Text>
              ) : (
                <Stack as="ul" gap={2} listStyleType="none" m={0} p={0}>
                  {detail.recentSupporters.map((supporter) => (
                    <Flex
                      as="li"
                      key={`${supporter.donorName}-${supporter.givenOnUtc}`}
                      justify="space-between"
                      gap={3}
                    >
                      <Text fontSize="sm" minW={0}>
                        {supporter.donorName}
                      </Text>
                      <Text fontSize="sm" fontWeight="600" whiteSpace="nowrap">
                        {formatMoney(supporter.amount, detail.currencySymbol)}
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

export default ModeratedFundraiserPage;
