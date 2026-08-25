import { describe, expect, it } from 'vitest';
import { isEmailShaped, showingRange, splitAddresses } from './invitationCopy';

describe('splitAddresses', () => {
  it('Split_AddressesPastedWithCommasSpacesAndNewLines_ReadsThemAll', () => {
    expect(splitAddresses('one@a.test, two@b.test\nthree@c.test four@d.test')).toEqual([
      'one@a.test',
      'two@b.test',
      'three@c.test',
      'four@d.test',
    ]);
  });

  it('Split_EmptyText_ReturnsNothingRatherThanOneBlankAddress', () => {
    expect(splitAddresses('   \n  ')).toEqual([]);
  });

  it('Split_TrailingSeparators_DoesNotProduceEmptyEntries', () => {
    expect(splitAddresses('one@a.test,,, ')).toEqual(['one@a.test']);
  });
});

describe('isEmailShaped', () => {
  it('Shape_OrdinaryAddress_IsAccepted', () => {
    expect(isEmailShaped('sara.malik@example.co.uk')).toBe(true);
  });

  it('Shape_AddressWithNoDomainDot_IsRefused', () => {
    expect(isEmailShaped('sara@localhost')).toBe(false);
  });

  it('Shape_TextWithNoAtSign_IsRefused', () => {
    expect(isEmailShaped('not-an-address')).toBe(false);
  });

  it('Shape_AddressLongerThanTheStandardAllows_IsRefused', () => {
    expect(isEmailShaped(`${'a'.repeat(250)}@example.test`)).toBe(false);
  });
});

describe('showingRange', () => {
  it('Range_FirstPage_CountsFromOne', () => {
    expect(showingRange(1, 20, 45)).toBe('Showing 1-20 of 45');
  });

  it('Range_LastPage_StopsAtTheTotalRatherThanThePageSize', () => {
    expect(showingRange(3, 20, 45)).toBe('Showing 41-45 of 45');
  });

  it('Range_NothingToShow_SaysSoRatherThanShowingZeroToZero', () => {
    expect(showingRange(1, 20, 0)).toBe('No invitations');
  });
});
