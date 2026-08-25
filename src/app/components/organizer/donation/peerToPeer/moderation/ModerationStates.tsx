import { ReactNode } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { MdOutlineVolunteerActivism } from 'react-icons/md';
import { FundraiserStatus } from 'app/interface/donationInter/fundraiserConsoleDto';
import { HIDDEN_LABEL, SHOWING_LABEL, STATUS_LABELS } from './moderationCopy';

interface ModerationErrorProps {
  message: string;
  onRetry: () => void;
}

export const ModerationError = ({ message, onRetry }: ModerationErrorProps) => (
  <Alert status="error" borderRadius="12px">
    <AlertIcon />
    <Box flex="1">
      <Text fontSize="sm">{message}</Text>
    </Box>
    <Button size="sm" variant="outline" minH="44px" onClick={onRetry} sx={{ cursor: 'pointer' }}>
      Try again
    </Button>
  </Alert>
);

interface ModerationSkeletonProps {
  rows?: number;
}

/** Mirrors the height of a loaded row so the layout does not jump once the data lands. */
export const ModerationSkeleton = ({ rows = 5 }: ModerationSkeletonProps) => (
  <Stack gap={3} aria-hidden="true">
    <Skeleton height="120px" borderRadius="16px" />
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton key={index} height="64px" borderRadius="12px" />
    ))}
  </Stack>
);

interface ModerationEmptyStateProps {
  heading: string;
  body: string;
  action?: ReactNode;
}

export const ModerationEmptyState = ({ heading, body, action }: ModerationEmptyStateProps) => (
  <Stack
    align="center"
    textAlign="center"
    gap={3}
    py={{ base: 8, md: 12 }}
    px={4}
    borderWidth="1px"
    borderStyle="dashed"
    borderColor="secondaryGray.300"
    borderRadius="16px"
  >
    <Box fontSize="32px" color="secondaryGray.500" aria-hidden="true">
      <MdOutlineVolunteerActivism />
    </Box>
    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="700">
      {heading}
    </Text>
    <Text fontSize="sm" color="secondaryGray.600" maxW="420px">
      {body}
    </Text>
    {action}
  </Stack>
);

const STATUS_SCHEMES: Record<FundraiserStatus, string> = {
  Active: 'green',
  PendingApproval: 'orange',
  Paused: 'gray',
  Rejected: 'red',
};

export const FundraiserStatusBadge = ({ status }: { status: FundraiserStatus }) => (
  <Badge colorScheme={STATUS_SCHEMES[status]} borderRadius="8px" px={2} py={1} fontSize="xs">
    {STATUS_LABELS[status]}
  </Badge>
);

export const TeamVisibilityBadge = ({ isHidden }: { isHidden: boolean }) => (
  <Badge colorScheme={isHidden ? 'gray' : 'green'} borderRadius="8px" px={2} py={1} fontSize="xs">
    {isHidden ? HIDDEN_LABEL : SHOWING_LABEL}
  </Badge>
);
