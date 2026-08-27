import { describe, expect, it } from 'vitest';
import { REASON_HELP, fundraiserActionCopy, teamActionCopy } from './moderationCopy';

/**
 * What the confirmation dialog promises before a charity commits to a decision. Two of these
 * sentences are load bearing: the supporter is emailed the outcome, and the reason the charity types
 * for its own records is not part of that email.
 */
describe('moderationCopy', () => {
  it('Approve_BeforeConfirming_SaysTheSupporterIsToldTheyWereApproved', () => {
    expect(fundraiserActionCopy('Approve', 'Sara Malik').body).toContain(
      'They are emailed that you approved it.',
    );
  });

  it('Reject_BeforeConfirming_SaysTheSupporterIsToldTheOutcome', () => {
    expect(fundraiserActionCopy('Reject', 'Sara Malik').body).toContain(
      'They are emailed that it was not approved',
    );
  });

  it('Reject_BeforeConfirming_SaysTheReasonStaysWithTheCharity', () => {
    expect(fundraiserActionCopy('Reject', 'Sara Malik').body).toContain(
      'without the reason you write below',
    );
    expect(REASON_HELP).toContain('The supporter is not shown what you write here.');
  });

  it('Hide_BeforeConfirming_PromisesNoEmailBecauseNoneIsSent', () => {
    expect(fundraiserActionCopy('Hide', 'Sara Malik').body).not.toContain('emailed');
    expect(fundraiserActionCopy('Unhide', 'Sara Malik').body).not.toContain('emailed');
  });

  it('Team_BeforeConfirming_PromisesNoEmailBecauseTeamsAreNotReviewed', () => {
    expect(teamActionCopy('Hide', 'Team Falcon').body).not.toContain('emailed');
    expect(teamActionCopy('Unhide', 'Team Falcon').body).not.toContain('emailed');
  });

  it('EveryAction_BeforeConfirming_NamesWhatItIsAbout', () => {
    expect(fundraiserActionCopy('Approve', 'Sara Malik').title).toBe('Approve Sara Malik?');
    expect(fundraiserActionCopy('Reject', 'Sara Malik').title).toBe('Turn down Sara Malik?');
    expect(teamActionCopy('Hide', 'Team Falcon').title).toBe('Hide Team Falcon?');
  });
});
