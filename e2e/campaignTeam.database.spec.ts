import { expect, test } from '@playwright/test';
import { execute, querySingleValue } from './support/database';
import { PROBE_LIFECYCLE_TRAIL_SQL } from './support/fundraiserPages';

/**
 * Two rules stop a team being duplicated, and both live in the database rather than in application
 * code: a team address is unique per campaign, and one fundraising page belongs to one team. A
 * service-level check cannot replace either - two concurrent joins would both pass it - so these
 * exercise the real filtered indexes, which is the only place the filter on IsDeleted can be proven.
 */

const PROBE_TAG = 'e2e-team-db';
const SLUG = 'e2e-team-uniqueness-probe';
const OTHER_SLUG = 'e2e-team-uniqueness-probe-second';

let campaignId: string;
let organizerId: string;
let firstFundraiserId: string;
let secondFundraiserId: string;

const insertTeam = (slug: string, captainUserId: string, isDeleted: 0 | 1 = 0): void =>
  execute(`
    INSERT INTO CampaignTeam
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, CaptainUserId, Slug, Name, Story,
       TeamGoal, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, ${organizerId}, ${campaignId}, ${captainUserId}, '${slug}', 'E2E Team Probe',
       'Created by the e2e suite.', 500, ${isDeleted}, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

const teamIdOf = (slug: string): string =>
  querySingleValue(`
    SELECT CAST(Id AS VARCHAR(20)) FROM CampaignTeam
    WHERE DonationCampaignId = ${campaignId} AND Slug = '${slug}' AND CreatedBy = '${PROBE_TAG}';
  `);

const insertMembership = (teamId: string, fundraiserId: string, isDeleted: 0 | 1 = 0): void =>
  execute(`
    INSERT INTO CampaignTeamMember
      (UniqueId, CampaignTeamId, CampaignFundraiserId, JoinedOnUtc, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), ${teamId}, ${fundraiserId}, SYSUTCDATETIME(), ${isDeleted}, '${PROBE_TAG}',
       SYSUTCDATETIME());
  `);

const insertFundraiser = (slug: string, userId: string): string => {
  execute(`
    INSERT INTO CampaignFundraiser
      (UniqueId, RowVersion, OrganizerId, DonationCampaignId, UserId, Slug, DisplayName, Story,
       PersonalGoal, CurrentStatus, IsDeleted, CreatedBy, CreatedOnUtc)
    VALUES
      (NEWID(), 0, ${organizerId}, ${campaignId}, ${userId}, '${slug}', 'E2E Team Member Probe', NULL,
       100, 'Active', 0, '${PROBE_TAG}', SYSUTCDATETIME());
  `);

  return querySingleValue(`
    SELECT CAST(Id AS VARCHAR(20)) FROM CampaignFundraiser
    WHERE DonationCampaignId = ${campaignId} AND Slug = '${slug}' AND CreatedBy = '${PROBE_TAG}';
  `);
};

const removeProbes = (): void =>
  execute(`
    ${PROBE_LIFECYCLE_TRAIL_SQL}

    DELETE FROM CampaignTeamMember WHERE CreatedBy = '${PROBE_TAG}';
    DELETE FROM CampaignTeam WHERE CreatedBy = '${PROBE_TAG}';
    DELETE FROM CampaignFundraiser WHERE CreatedBy = '${PROBE_TAG}';
  `);

test.beforeAll(() => {
  const row = querySingleValue(`
    SELECT TOP 1 CAST(Id AS VARCHAR(20)) + '|' + CAST(OrganizerId AS VARCHAR(20))
    FROM DonationCampaign
    WHERE IsDeleted = 0
    ORDER BY Id DESC;
  `);

  [campaignId, organizerId] = row.split('|');
  removeProbes();
});

test.beforeEach(() => {
  removeProbes();
  firstFundraiserId = insertFundraiser('e2e-team-db-first', '1');
  secondFundraiserId = insertFundraiser('e2e-team-db-second', '2');
});

test.afterAll(() => removeProbes());

test.describe('CampaignTeam uniqueness', () => {
  test('Team_SecondTeamWithTheSameAddressOnTheSameCampaign_IsRejectedByTheDatabase', () => {
    insertTeam(SLUG, '1');

    expect(() => insertTeam(SLUG, '2')).toThrow(/UX_CampaignTeam_Campaign_Slug/);
  });

  test('Team_AddressFreedByDisbanding_CanBeClaimedAgain', () => {
    insertTeam(SLUG, '1');
    execute(`
      UPDATE CampaignTeam SET IsDeleted = 1
      WHERE Slug = '${SLUG}' AND CreatedBy = '${PROBE_TAG}';
    `);

    expect(() => insertTeam(SLUG, '2')).not.toThrow();

    const live = querySingleValue(`
      SELECT CAST(COUNT(*) AS VARCHAR(10)) FROM CampaignTeam
      WHERE Slug = '${SLUG}' AND IsDeleted = 0 AND CreatedBy = '${PROBE_TAG}';
    `);

    expect(live).toBe('1');
  });

  test('Team_DifferentAddressesOnTheSameCampaign_AreAccepted', () => {
    insertTeam(SLUG, '1');

    expect(() => insertTeam(OTHER_SLUG, '2')).not.toThrow();
  });
});

test.describe('CampaignTeamMember uniqueness', () => {
  test('Membership_OneFundraisingPageInTwoTeams_IsRejectedByTheDatabase', () => {
    insertTeam(SLUG, '1');
    insertTeam(OTHER_SLUG, '2');

    insertMembership(teamIdOf(SLUG), firstFundraiserId);

    expect(() => insertMembership(teamIdOf(OTHER_SLUG), firstFundraiserId)).toThrow(
      /UX_CampaignTeamMember_Fundraiser/,
    );
  });

  test('Membership_SameFundraiserJoiningTheSameTeamTwice_IsRejectedByTheDatabase', () => {
    insertTeam(SLUG, '1');
    const teamId = teamIdOf(SLUG);

    insertMembership(teamId, firstFundraiserId);

    expect(() => insertMembership(teamId, firstFundraiserId)).toThrow(
      /UX_CampaignTeamMember_Fundraiser/,
    );
  });

  test('Membership_FreedByLeaving_LetsThatPageJoinAnotherTeam', () => {
    insertTeam(SLUG, '1');
    insertTeam(OTHER_SLUG, '2');

    insertMembership(teamIdOf(SLUG), firstFundraiserId, 1);

    expect(() => insertMembership(teamIdOf(OTHER_SLUG), firstFundraiserId)).not.toThrow();
  });

  test('Membership_TwoDifferentPagesInOneTeam_AreAccepted', () => {
    insertTeam(SLUG, '1');
    const teamId = teamIdOf(SLUG);

    insertMembership(teamId, firstFundraiserId);

    expect(() => insertMembership(teamId, secondFundraiserId)).not.toThrow();
  });
});
