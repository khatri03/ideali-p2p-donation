import {
  Badge,
  Box,
  Flex,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Invitation } from 'app/interface/donationInter/fundraiserInvitationDto';
import {
  ADDRESS_COLUMN,
  EXPIRES_COLUMN,
  INVITED_BY_COLUMN,
  SENT_COLUMN,
  STATUS_COLUMN,
  STATUS_SCHEMES,
} from './invitationCopy';

interface InvitationResultsProps {
  invitations: Invitation[];
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

const StatusBadge = ({ invitation }: { invitation: Invitation }) => (
  <Badge
    colorScheme={STATUS_SCHEMES[invitation.status] ?? 'gray'}
    borderRadius="8px"
    px={2}
    py={1}
    fontSize="xs"
  >
    {invitation.status}
  </Badge>
);

const SuppressionNote = ({ invitation }: { invitation: Invitation }) =>
  invitation.suppressionReason ? (
    <Text fontSize="xs" color="red.500">
      {invitation.suppressionReason}
    </Text>
  ) : null;

/**
 * Eight columns do not fit a phone, so the same rows render as cards below lg and as a table above it.
 * Both copies exist at every width and only one of them is on screen.
 */
export const InvitationResults = ({ invitations }: InvitationResultsProps) => (
  <>
    <Stack display={{ base: 'flex', lg: 'none' }} gap={3}>
      {invitations.map((invitation) => (
        <Box
          key={invitation.uniqueId}
          borderWidth="1px"
          borderColor="secondaryGray.300"
          borderRadius="12px"
          p={4}
        >
          <Stack gap={2}>
            <Flex align="center" justify="space-between" gap={3} wrap="wrap">
              <Text fontSize="sm" fontWeight="700" wordBreak="break-all">
                {invitation.emailAddress}
              </Text>
              <StatusBadge invitation={invitation} />
            </Flex>
            <SuppressionNote invitation={invitation} />
            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
              {SENT_COLUMN}: {formatDate(invitation.createdOnUtc)} · {EXPIRES_COLUMN}:{' '}
              {formatDate(invitation.expiresOnUtc)}
            </Text>
            <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
              {INVITED_BY_COLUMN}: {invitation.invitedByName}
            </Text>
          </Stack>
        </Box>
      ))}
    </Stack>

    <TableContainer display={{ base: 'none', lg: 'block' }} overflowX="auto">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>{ADDRESS_COLUMN}</Th>
            <Th>{STATUS_COLUMN}</Th>
            <Th>{SENT_COLUMN}</Th>
            <Th>{EXPIRES_COLUMN}</Th>
            <Th>{INVITED_BY_COLUMN}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {invitations.map((invitation) => (
            <Tr key={invitation.uniqueId}>
              <Td>
                <Stack gap={0}>
                  <Text fontSize="sm">{invitation.emailAddress}</Text>
                  <SuppressionNote invitation={invitation} />
                </Stack>
              </Td>
              <Td>
                <StatusBadge invitation={invitation} />
              </Td>
              <Td fontSize="sm">{formatDate(invitation.createdOnUtc)}</Td>
              <Td fontSize="sm">{formatDate(invitation.expiresOnUtc)}</Td>
              <Td fontSize="sm">{invitation.invitedByName}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  </>
);

export default InvitationResults;
