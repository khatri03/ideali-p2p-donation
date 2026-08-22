import { expect, test } from '@playwright/test';
import { execute, query, querySingleValue } from './support/database';

/**
 * Verification looks a link up by the digest of the token it carries and by nothing else. That makes
 * the digest an identity: two rows sharing one would make a single link confirm whichever account the
 * query happened to return first, so uniqueness is enforced by the schema rather than by the service.
 */

const PROBE_HASH = 'e2e00000000000000000000000000000000000000000000000000000000probe';

const insertProbe = (): void =>
  execute(`
    INSERT INTO EmailVerificationRequest (UniqueId, UserId, CampaignUniqueId, TokenHash, ExpiresOnUtc, IsUsed, CreatedOnUtc)
    SELECT TOP 1 NEWID(), account.Id, NEWID(), '${PROBE_HASH}', DATEADD(MINUTE, 60, GETUTCDATE()), 0, GETUTCDATE()
    FROM [User] account
    ORDER BY account.Id;
  `);

const removeProbes = (): void =>
  execute(`DELETE FROM EmailVerificationRequest WHERE TokenHash = '${PROBE_HASH}';`);

test.beforeAll(() => {
  removeProbes();
});

test.afterAll(() => {
  removeProbes();
});

test.describe('Email verification token storage', () => {
  test('TokenHash_AlreadyStored_IsRejectedByTheDatabase', () => {
    insertProbe();

    expect(() => insertProbe()).toThrow(/IX_EmailVerificationRequest_TokenHash/);
  });

  test('TokenHash_UniquenessIndex_ExistsInTheLiveSchema', () => {
    const rows = query(`
      SELECT name
      FROM sys.indexes
      WHERE object_id = OBJECT_ID('EmailVerificationRequest')
        AND name = 'IX_EmailVerificationRequest_TokenHash'
        AND is_unique = 1;
    `);

    expect(rows).toEqual(['IX_EmailVerificationRequest_TokenHash']);
  });

  /**
   * Wide enough for a SHA-256 in hex and no wider. A column that could hold more would be a column
   * that could hold a token.
   */
  test('TokenHash_Column_HoldsADigestAndIsNotNullable', () => {
    const shape = querySingleValue(`
      SELECT CAST(max_length AS VARCHAR(10)) + ' ' + CASE WHEN is_nullable = 1 THEN 'nullable' ELSE 'not null' END
      FROM sys.columns
      WHERE object_id = OBJECT_ID('EmailVerificationRequest') AND name = 'TokenHash';
    `);

    expect(shape).toBe('64 not null');
  });

  /**
   * Deleting an account takes its outstanding links with it. A link left behind would still confirm
   * a user id that no longer belongs to anybody.
   */
  test('Requests_AreRemovedWithTheAccountTheyBelongTo', () => {
    const deleteRule = querySingleValue(`
      SELECT delete_referential_action_desc
      FROM sys.foreign_keys
      WHERE name = 'FK_EmailVerificationRequest_User_UserId';
    `);

    expect(deleteRule).toBe('CASCADE');
  });
});
