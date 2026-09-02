import { describe, expect, it } from 'vitest';
import { fundraiserChoices, teamChoices } from './ModerationActionsBar';
import { TAKE_DOWN_LABEL } from './moderationCopy';

const actionsOf = (choices: ReturnType<typeof fundraiserChoices>) =>
  choices.map((choice) => choice.action);

describe('fundraiserChoices', () => {
  /** A page still waiting is answered, so the two answers are the ones offered. */
  it('Actions_PageWaitingForApproval_OffersApprovingOrTurningItDown', () => {
    expect(actionsOf(fundraiserChoices('PendingApproval'))).toEqual(['Approve', 'Reject']);
  });

  /** A live page cannot be approved again, so hiding it is what stands beside ending it. */
  it('Actions_LivePage_OffersHidingItRatherThanApprovingItAgain', () => {
    expect(actionsOf(fundraiserChoices('Active'))).toEqual(['Hide', 'Reject']);
  });

  it('Actions_HiddenPage_OffersBringingItBack', () => {
    expect(actionsOf(fundraiserChoices('Paused'))).toEqual(['Unhide', 'Reject']);
  });

  it('Actions_PageAlreadyTurnedDown_OffersOnlyLettingItBackIn', () => {
    expect(actionsOf(fundraiserChoices('Rejected'))).toEqual(['Approve']);
  });

  /**
   * Turning something down answers a request. A page that is already live was answered long ago, and
   * calling the same button "Turn down" there made a charity press it to find out what it meant.
   */
  it('Actions_LivePage_CallsEndingItTakingItDownRatherThanTurningItDown', () => {
    const ending = fundraiserChoices('Active').find((choice) => choice.action === 'Reject');

    expect(ending?.label).toBe(TAKE_DOWN_LABEL);
  });

  /** The same decision on a page nobody has seen yet is still a refusal of a request. */
  it('Actions_PageWaitingForApproval_StillCallsRefusingItTurningItDown', () => {
    const refusal = fundraiserChoices('PendingApproval').find(
      (choice) => choice.action === 'Reject',
    );

    expect(refusal?.label).toBe('Turn down');
  });

  /**
   * The one difference a charity has to see before pressing either button: hiding is silent and
   * reversible, ending a page is told to the supporter. Both used to look identical.
   */
  it('Actions_LivePage_SaysWhichDecisionReachesTheSupporter', () => {
    const [hide, ending] = fundraiserChoices('Active');

    expect(hide.hint).toContain('Nobody is told');
    expect(ending.hint).toContain('emailed');
  });

  /** Presentation follows consequence: the reversible one is quieter than the one that is announced. */
  it('Actions_LivePage_PresentsTheReversibleDecisionMoreQuietlyThanTheFinalOne', () => {
    const [hide, ending] = fundraiserChoices('Active');

    expect(hide.tone).toBe('caution');
    expect(ending.tone).toBe('danger');
  });
});

describe('teamChoices', () => {
  it('Actions_VisibleTeam_OffersHidingItAndNothingElse', () => {
    expect(actionsOf(teamChoices(false))).toEqual(['Hide']);
  });

  it('Actions_HiddenTeam_OffersBringingItBackAndNothingElse', () => {
    expect(actionsOf(teamChoices(true))).toEqual(['Unhide']);
  });

  /** Hiding a team never stops the fundraising inside it, and the charity is told so before deciding. */
  it('Actions_VisibleTeam_SaysThePagesInsideKeepRaising', () => {
    expect(teamChoices(false)[0].hint).toContain('keep raising');
  });
});
