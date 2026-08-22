import { afterEach, describe, expect, it } from 'vitest';
import { storedDisplayName } from './session';

afterEach(() => {
  localStorage.clear();
});

describe('storedDisplayName', () => {
  it('DisplayName_StoredForANamedAccount_IsReturnedAsIs', () => {
    localStorage.setItem('userName', 'Sarah Khan');

    expect(storedDisplayName()).toBe('Sarah Khan');
  });

  it('DisplayName_StringifiedUndefined_IsNotOfferedAsAName', () => {
    localStorage.setItem('userName', undefined as unknown as string);

    expect(storedDisplayName()).toBe('');
  });

  it('DisplayName_StringifiedNull_IsNotOfferedAsAName', () => {
    localStorage.setItem('userName', null as unknown as string);

    expect(storedDisplayName()).toBe('');
  });

  it('DisplayName_NeverStored_IsEmptyRatherThanNull', () => {
    expect(storedDisplayName()).toBe('');
  });

  it('DisplayName_StoredAsWhitespace_IsTreatedAsAbsent', () => {
    localStorage.setItem('userName', '   ');

    expect(storedDisplayName()).toBe('');
  });

  it('DisplayName_StoredWithSurroundingSpaces_IsTrimmed', () => {
    localStorage.setItem('userName', '  Sarah Khan  ');

    expect(storedDisplayName()).toBe('Sarah Khan');
  });
});
