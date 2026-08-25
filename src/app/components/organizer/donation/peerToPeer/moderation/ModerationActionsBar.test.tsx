import { describe, expect, it } from 'vitest';
import { fundraiserActionsFor, teamActionsFor } from './ModerationActionsBar';

describe('fundraiserActionsFor', () => {
  it('Actions_PageWaitingForApproval_OffersApprovingOrTurningItDown', () => {
    expect(fundraiserActionsFor('PendingApproval')).toEqual(['Approve', 'Reject']);
  });

  it('Actions_LivePage_OffersHidingItRatherThanApprovingItAgain', () => {
    expect(fundraiserActionsFor('Active')).toEqual(['Hide', 'Reject']);
  });

  it('Actions_HiddenPage_OffersBringingItBack', () => {
    expect(fundraiserActionsFor('Paused')).toEqual(['Unhide', 'Reject']);
  });

  it('Actions_PageAlreadyTurnedDown_OffersOnlyLettingItBackIn', () => {
    expect(fundraiserActionsFor('Rejected')).toEqual(['Approve']);
  });
});

describe('teamActionsFor', () => {
  it('Actions_VisibleTeam_OffersHidingItAndNothingElse', () => {
    expect(teamActionsFor(false)).toEqual(['Hide']);
  });

  it('Actions_HiddenTeam_OffersBringingItBackAndNothingElse', () => {
    expect(teamActionsFor(true)).toEqual(['Unhide']);
  });
});
