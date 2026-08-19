import { Badge, BadgeProps } from '@chakra-ui/react';

// Canonical status colors, matching MembershipPendingApprovalsPage's STATUS_COLOR/STATUS_BG.
// Extend here (not per-component) so every status pill in the app stays in sync.
export const STATUS_COLOR: Record<string, string> = {
  Active: 'green.600',
  Pending: 'orange.500',
  PendingApproval: 'orange.500',
  'Pending Approval': 'orange.500',
  Expired: 'red.500',
  Rejected: 'red.400',
  Cancelled: 'gray.500',
  Inactive: 'gray.400',
  InActive: 'gray.400',
  Upgraded: 'blue.500',
  Completed: 'green.600',
  Failed: 'red.500',
  Refunded: 'purple.500',
  Paid: 'teal.600',
  Urgent: 'red.500',
  Important: 'orange.500',
  Normal: 'blue.500',
};

export const STATUS_BG: Record<string, string> = {
  Active: 'green.50',
  Pending: 'orange.50',
  PendingApproval: 'orange.50',
  'Pending Approval': 'orange.50',
  Expired: 'red.50',
  Rejected: 'red.50',
  Cancelled: 'gray.100',
  Inactive: 'gray.100',
  InActive: 'gray.100',
  Upgraded: 'blue.50',
  Completed: 'green.50',
  Failed: 'red.50',
  Refunded: 'purple.50',
  Paid: 'teal.50',
  Urgent: 'red.50',
  Important: 'orange.50',
  Normal: 'blue.50',
};

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  /** Allowed when rendering as="button" (e.g. clickable badges). */
  type?: 'button' | 'submit' | 'reset';
  /** Text shown in the pill. */
  label: string;
  /**
   * 'status' — colored by STATUS_COLOR/STATUS_BG, border matches text color.
   * 'tag'    — a category/type label (e.g. membership name); border is a lighter distinct shade.
   * 'info'   — a plain neutral pill (e.g. email); no text-transform.
   */
  variant?: 'status' | 'tag' | 'info';
  /** Only used by the 'tag' variant, e.g. "teal", "blue". */
  colorScheme?: string;
  /** 'md' (default) matches the canonical size; 'sm' is a compact variant for tight spaces. */
  size?: 'sm' | 'md';
}

export default function StatusBadge({
  label,
  variant = 'status',
  colorScheme = 'teal',
  size = 'md',
  ...rest
}: StatusBadgeProps) {
  let bg: string;
  let color: string;
  let borderColor: string;
  let fontWeight: BadgeProps['fontWeight'];

  if (variant === 'status') {
    bg = STATUS_BG[label] ?? 'gray.100';
    color = STATUS_COLOR[label] ?? 'gray.500';
    borderColor = color;
    fontWeight = 'bold';
  } else if (variant === 'info') {
    bg = 'gray.100';
    color = 'gray.600';
    borderColor = 'gray.300';
    fontWeight = 'medium';
  } else {
    bg = `${colorScheme}.50`;
    color = `${colorScheme}.700`;
    borderColor = `${colorScheme}.200`;
    fontWeight = 'medium';
  }

  const compact = size === 'sm';

  return (
    <Badge
      bg={bg}
      color={color}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      fontSize={compact ? '10px' : 'xs'}
      fontWeight={fontWeight}
      px={compact ? 2 : 2.5}
      py={compact ? 0.5 : 1}
      textTransform={variant === 'info' ? 'none' : undefined}
      flexShrink={0}
      {...rest}
    >
      {label}
    </Badge>
  );
}
