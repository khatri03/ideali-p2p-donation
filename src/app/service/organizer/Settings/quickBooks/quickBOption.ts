export const INTEGRATION_META: Record<
  string,
  { shortLabel: string; bg: string }
> = {
  'Constant Contact': { shortLabel: 'CC', bg: '#1565C0' },
  Mailchimp: { shortLabel: 'MC', bg: '#E8820C' },
  Quickbooks: { shortLabel: 'QB', bg: '#2CA01C' },
};

export function getIntegrationMeta(text: string) {
  return (
    INTEGRATION_META[text] ?? {
      shortLabel: text.slice(0, 2).toUpperCase(),
      bg: '#718096',
    }
  );
}

// Hardcoded integrations shown in the empty-state preview grid
export const PREVIEW_INTEGRATIONS = [
  { shortLabel: 'CC', bg: '#1565C0', name: 'Constant Contact' },
  { shortLabel: 'QB', bg: '#2CA01C', name: 'Quickbooks' },
];

// Hardcoded Quickbooks option injected into the modal list
export const QUICKBOOKS_OPTION = {
  value: -1, // sentinel value; detected in handleConfirm
  text: 'Quickbooks',
};
