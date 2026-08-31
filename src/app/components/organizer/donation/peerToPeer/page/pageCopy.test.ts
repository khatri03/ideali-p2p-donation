import { describe, expect, it } from 'vitest';
import { DONATE_CTA, DONATE_CTA_NAME_LIMIT, DONATE_CTA_WITHOUT_NAME } from './pageCopy';

describe('DONATE_CTA', () => {
  /**
   * A donor arriving from a shared link may not know whose page they are on, so a name short enough to
   * sit in a control is said on the button itself.
   */
  it('DonateLabel_ShortName_SaysWhoTheMoneyGoesTo', () => {
    expect(DONATE_CTA('Sarah Khan')).toBe('Donate to Sarah Khan');
  });

  /**
   * A page name may be eighty characters long. Past the point where a name still reads as a label, the
   * button states the action alone rather than becoming a paragraph a donor has to read to the end.
   */
  it('DonateLabel_NameTooLongForAControl_StatesTheActionAlone', () => {
    expect(DONATE_CTA('Raise fund for Osama to test PAD')).toBe(DONATE_CTA_WITHOUT_NAME);
  });

  /** The limit is inclusive, so a name exactly at it is still worth naming. */
  it('DonateLabel_NameExactlyAtTheLimit_StillSaysTheName', () => {
    const name = 'x'.repeat(DONATE_CTA_NAME_LIMIT);

    expect(DONATE_CTA(name)).toBe(`Donate to ${name}`);
  });

  /** One character past the limit is the first that is dropped, so the boundary cannot drift unnoticed. */
  it('DonateLabel_NameOneCharacterPastTheLimit_StatesTheActionAlone', () => {
    expect(DONATE_CTA('x'.repeat(DONATE_CTA_NAME_LIMIT + 1))).toBe(DONATE_CTA_WITHOUT_NAME);
  });

  /**
   * A missing or blank name must never produce "Donate to" with nothing after it, which reads as a
   * broken screen rather than an action.
   */
  it('DonateLabel_NoNameAtAll_StatesTheActionAlone', () => {
    expect(DONATE_CTA('')).toBe(DONATE_CTA_WITHOUT_NAME);
    expect(DONATE_CTA('   ')).toBe(DONATE_CTA_WITHOUT_NAME);
    expect(DONATE_CTA(undefined as unknown as string)).toBe(DONATE_CTA_WITHOUT_NAME);
  });

  /** Surrounding whitespace is the supporter's typing, not part of their name. */
  it('DonateLabel_NamePaddedWithSpaces_ReadsWithoutThem', () => {
    expect(DONATE_CTA('  Sarah Khan  ')).toBe('Donate to Sarah Khan');
  });
});
