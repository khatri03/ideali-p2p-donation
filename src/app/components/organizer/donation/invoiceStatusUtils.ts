/**
 * invoiceStatusUtils.ts - Invoice Status Constants and Utilities
 */

export enum InvoiceStatus {
  PENDING_PAYMENT = 'PendingPayment',
  PARTIALLY_PAID = 'PartiallyPaid',
  PAID = 'Paid',
  CANCELLED = 'Cancelled',
  REFUND = 'Refund',
  ADJUSTED_IN_SYSTEM = 'AdjustedInSystem',
}

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING_PAYMENT]: 'Pending Payment',
  [InvoiceStatus.PARTIALLY_PAID]: 'Partially Paid',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
  [InvoiceStatus.REFUND]: 'Refund',
  [InvoiceStatus.ADJUSTED_IN_SYSTEM]: 'Adjusted In System',
};

export const STATUS_COLOR_MAP: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING_PAYMENT]: 'yellow',
  [InvoiceStatus.PARTIALLY_PAID]: 'orange',
  [InvoiceStatus.PAID]: 'green',
  [InvoiceStatus.CANCELLED]: 'red',
  [InvoiceStatus.REFUND]: 'purple',
  [InvoiceStatus.ADJUSTED_IN_SYSTEM]: 'blue',
};

/**
 * Get all status options for dropdowns/selects
 */
export const getStatusOptions = () => [
  { value: '', label: 'All Statuses' },
  ...Object.entries(InvoiceStatus).map(([_, value]) => ({
    value,
    label: STATUS_LABELS[value as InvoiceStatus],
  })),
];

/**
 * Get the display label for a status
 */
// invoiceStatusUtils.ts

export const getStatusLabel = (status: string | InvoiceStatus): string => {
  if (!status) return 'Unknown';

  // Direct match first
  if (STATUS_LABELS[status as InvoiceStatus]) {
    return STATUS_LABELS[status as InvoiceStatus];
  }

  // Case-insensitive fallback — normalize and search
  const normalized = status.toLowerCase().replace(/[_\-\s]/g, '');
  const match = Object.entries(STATUS_LABELS).find(
    ([key]) => key.toLowerCase().replace(/[_\-\s]/g, '') === normalized,
  );

  return match ? match[1] : status; // return raw value instead of 'Unknown'
};

export const getStatusColorScheme = (
  status: string | InvoiceStatus,
): string => {
  if (!status) return 'gray';

  // Direct match first
  if (STATUS_COLOR_MAP[status as InvoiceStatus]) {
    return STATUS_COLOR_MAP[status as InvoiceStatus];
  }

  // Case-insensitive fallback
  const normalized = status.toLowerCase().replace(/[_\-\s]/g, '');
  const match = Object.entries(STATUS_COLOR_MAP).find(
    ([key]) => key.toLowerCase().replace(/[_\-\s]/g, '') === normalized,
  );

  return match ? match[1] : 'gray';
};

/**
 * Get the color scheme for a status badge
 */

/**
 * Check if invoice is in a terminal state
 */
export const isTerminalStatus = (status: string | InvoiceStatus): boolean => {
  return [
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.REFUND,
  ].includes(status as InvoiceStatus);
};

/**
 * Get related statuses (e.g., all paid-like statuses)
 */
export const getPaidStatuses = (): InvoiceStatus[] => {
  return [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID];
};

export const getUnpaidStatuses = (): InvoiceStatus[] => {
  return [InvoiceStatus.PENDING_PAYMENT];
};
