/**
 * User-facing wording shared by the settings page and the campaign wizard step, so both surfaces
 * describe the same consequence in the same words.
 */
export const switchOffMessage = (liveFundraiserCount: number): string => {
  if (liveFundraiserCount === 0) {
    return 'Nobody will be able to create a supporter page for this campaign until you turn it back on. Nothing is deleted.';
  }

  const pages =
    liveFundraiserCount === 1 ? '1 supporter page' : `${liveFundraiserCount} supporter pages`;

  return `${pages} will stop being reachable and will stop accepting donations. Nothing is deleted — the pages, their stories and every donation already made stay exactly as they are, and turning this back on restores them.`;
};

export const SWITCH_OFF_TITLE = 'Turn supporter fundraising off?';
export const SWITCH_OFF_CONFIRM = 'Turn it off';
export const SWITCH_OFF_CANCEL = 'Keep it on';

/**
 * The marking a campaign card carries when supporters may raise money on that campaign. The label is
 * the product's own short name for the feature; the hint spells it out, because a card gives an
 * abbreviation no room to explain itself.
 */
export const PEER_TO_PEER_PILL_LABEL = 'P2P';
export const PEER_TO_PEER_PILL_HINT =
  'P2P fundraising is on. Supporters can raise money for this campaign on their own pages. Open its settings.';
