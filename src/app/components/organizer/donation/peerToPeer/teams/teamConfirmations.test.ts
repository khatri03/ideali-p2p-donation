import { describe, expect, it } from 'vitest';
import { buildTeamMember, buildTeamPage } from '../peerToPeerTestFactory';
import { describeConfirmation, leaveWarningFor } from './teamConfirmations';

const captain = buildTeamMember();
const member = buildTeamMember({
  uniqueId: 'second-membership',
  displayName: 'Ahmed Khalid',
  isCaptain: false,
});

describe('team confirmations', () => {
  it('Remove_Confirmation_NamesThePersonBeingRemoved', () => {
    const confirmation = describeConfirmation({ kind: 'remove', member }, buildTeamPage());

    expect(confirmation.title).toBe('Remove Ahmed Khalid from the team?');
    expect(confirmation.isDestructive).toBe(true);
  });

  it('Remove_Confirmation_SaysTheirOwnPageAndDonationsAreUnaffected', () => {
    const confirmation = describeConfirmation({ kind: 'remove', member }, buildTeamPage());

    expect(confirmation.body).toContain('keeps their fundraising page and every donation on it');
    expect(confirmation.body).toContain('the charity keeps the money already given');
  });

  it('HandOver_Confirmation_NamesThePersonTakingOverAndIsNotDestructive', () => {
    const confirmation = describeConfirmation({ kind: 'handOver', member }, buildTeamPage());

    expect(confirmation.title).toBe('Make Ahmed Khalid the captain?');
    expect(confirmation.isDestructive).toBe(false);
  });

  it('Leave_Confirmation_SaysWhatHappensToMoneyAlreadyRaised', () => {
    const confirmation = describeConfirmation({ kind: 'leave' }, buildTeamPage());

    expect(confirmation.title).toBe('Leave The Early Risers?');
    expect(confirmation.body).toContain('the charity keeps the money already given');
  });

  it('LeaveWarning_PlainMemberWithOthersInTheTeam_HasNothingExtraToWarnAbout', () => {
    expect(leaveWarningFor(buildTeamPage({ viewerRole: 'Member' }))).toBeUndefined();
  });

  it('LeaveWarning_CaptainWithOthersInTheTeam_SaysSomebodyElseTakesOver', () => {
    expect(leaveWarningFor(buildTeamPage({ viewerRole: 'Captain' }))).toBe(
      'You are the captain, so the longest-standing member takes over when you leave.',
    );
  });

  it('LeaveWarning_LastMember_SaysLeavingClosesTheTeam', () => {
    const alone = buildTeamPage({ viewerRole: 'Captain', members: [captain] });

    expect(leaveWarningFor(alone)).toBe(
      'You are the last member, so leaving closes this team. Its address will stop working.',
    );
  });
});
