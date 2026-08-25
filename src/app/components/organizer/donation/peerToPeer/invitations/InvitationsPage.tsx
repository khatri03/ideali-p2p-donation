import { Flex, FormControl, FormLabel, Input, Select, Stack, useToast } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { InvitationSendResult } from 'app/interface/donationInter/fundraiserInvitationDto';
import ModerationPagination from '../moderation/ModerationPagination';
import ModerationShell from '../moderation/ModerationShell';
import {
  ModerationEmptyState,
  ModerationError,
  ModerationSkeleton,
} from '../moderation/ModerationStates';
import InvitationComposer from './InvitationComposer';
import InvitationResults from './InvitationResults';
import InvitationSummaryPanel from './InvitationSummaryPanel';
import {
  ALL_STATUSES_LABEL,
  EMPTY_BODY,
  EMPTY_HEADING,
  INVITATIONS_HEADING,
  NO_MATCHES_BODY,
  NO_MATCHES_HEADING,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  STATUS_FILTER_LABEL,
} from './invitationCopy';
import useInvitationList from './useInvitationList';

/** The value the API filters by, and the word a person reads. They differ for one of the five. */
const STATUS_OPTIONS = [
  { value: 'Sent', label: 'Sent' },
  { value: 'Opened', label: 'Opened' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Suppressed', label: 'Not sent' },
];

/**
 * Screen 13. The charity invites people here and watches what happened to each invitation, and the
 * two halves share one reload so a send is reflected in the list without a manual refresh.
 */
export const InvitationsPage = () => {
  const { campaignUniqueId = '' } = useParams<{ campaignUniqueId: string }>();
  const list = useInvitationList(campaignUniqueId);
  const toast = useToast();

  const handleSent = (result: InvitationSendResult) => {
    toast({
      title: result.message,
      status: result.accepted > 0 ? 'success' : 'info',
      duration: 6000,
      isClosable: true,
    });

    list.reload();
  };

  const page = list.result?.page;
  const invitations = page?.pageData ?? [];

  return (
    <ModerationShell
      campaignUniqueId={campaignUniqueId}
      campaignName={list.result?.campaignName}
      heading={INVITATIONS_HEADING}
    >
      <Stack gap={{ base: 4, md: 5 }}>
        <InvitationComposer campaignUniqueId={campaignUniqueId} onSent={handleSent} />

        {list.error && <ModerationError message={list.error} onRetry={list.reload} />}

        {!list.error && list.isLoading && <ModerationSkeleton />}

        {!list.error && !list.isLoading && list.result && (
          <Stack gap={{ base: 4, md: 5 }}>
            <InvitationSummaryPanel summary={list.result.summary} />

            <Flex gap={3} wrap="wrap" direction={{ base: 'column', md: 'row' }}>
              <FormControl maxW={{ md: '320px' }}>
                <FormLabel fontSize="sm" htmlFor="invitation-search">
                  {SEARCH_LABEL}
                </FormLabel>
                <Input
                  id="invitation-search"
                  value={list.filters.search}
                  minH="44px"
                  placeholder={SEARCH_PLACEHOLDER}
                  onChange={(event) =>
                    list.setFilters({ ...list.filters, search: event.target.value })
                  }
                />
              </FormControl>
              <FormControl maxW={{ md: '220px' }}>
                <FormLabel fontSize="sm" htmlFor="invitation-status">
                  {STATUS_FILTER_LABEL}
                </FormLabel>
                <Select
                  id="invitation-status"
                  minH="44px"
                  value={list.filters.status ?? ''}
                  sx={{ cursor: 'pointer' }}
                  onChange={(event) =>
                    list.setFilters({
                      ...list.filters,
                      status: event.target.value || undefined,
                    })
                  }
                >
                  <option value="">{ALL_STATUSES_LABEL}</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Flex>

            {invitations.length === 0 ? (
              <ModerationEmptyState
                heading={list.isFiltered ? NO_MATCHES_HEADING : EMPTY_HEADING}
                body={list.isFiltered ? NO_MATCHES_BODY : EMPTY_BODY}
              />
            ) : (
              <Stack gap={4}>
                <InvitationResults invitations={invitations} />
                <ModerationPagination
                  pageNo={page!.pageNo}
                  pageSize={page!.pageSize}
                  pageCount={page!.pageCount}
                  totalRecordsCount={page!.totalRecordsCount}
                  onChange={list.setPage}
                />
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </ModerationShell>
  );
};

export default InvitationsPage;
