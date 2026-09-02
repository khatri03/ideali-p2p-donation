import { describe, expect, it } from 'vitest';
import {
  REASON_HELP,
  actionDoneMessage,
  fundraiserActionCopy,
  teamActionCopy,
} from './moderationCopy';

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
  /**
   * The confirmation must use the same word the button did. A charity that pressed "Take down" and is
   * then asked about turning the page down has been handed two names for one decision at the moment it
   * matters most.
   */
  it('ActionCopy_LivePage_AsksAboutTakingItDownRatherThanTurningItDown', () => {
    const copy = fundraiserActionCopy('Reject', 'Sara Malik', true);

    expect(copy.title).toBe('Take down Sara Malik?');
    expect(copy.confirmLabel).toBe('Take this page down');
  });

  /** Whichever word is used, the reason the charity writes never reaches the supporter. */
  it('ActionCopy_LivePage_StillKeepsTheReasonOutOfTheEmail', () => {
    expect(fundraiserActionCopy('Reject', 'Sara Malik', true).body).toContain(
      'without the reason you write below',
    );
  });

  /** What is said afterwards matches what was decided, so the record reads the way the charity meant it. */
  it('DoneMessage_LivePageEnded_SaysItWasTakenDown', () => {
    expect(actionDoneMessage('Reject', 'Sara Malik', true)).toBe('Sara Malik has been taken down.');
  });

  /** A page nobody had seen yet was refused, not ended, and is described that way. */
  it('DoneMessage_WaitingPageRefused_SaysItWasTurnedDown', () => {
    expect(actionDoneMessage('Reject', 'Sara Malik')).toBe('Sara Malik has been turned down.');
  });
});
