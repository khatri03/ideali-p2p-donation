import { describe, expect, it } from 'vitest';
import {
  campaignFromReturnPath,
  fundraiserJoinPath,
  sanitiseReturnPath,
  supporterSignUpPath,
  withReturnPath,
} from './returnPath';

const CAMPAIGN_ID = '3f2b19c4-0f6e-4a55-9a1d-52f0b7c9e881';
const JOIN_PATH = fundraiserJoinPath(CAMPAIGN_ID);

describe('sanitiseReturnPath', () => {
  it('ReturnPath_TheJoinScreen_IsAccepted', () => {
    expect(sanitiseReturnPath(JOIN_PATH)).toBe(JOIN_PATH);
  });

  it('ReturnPath_AbsoluteExternalUrl_IsRefused', () => {
    expect(sanitiseReturnPath('https://evil.test/steal')).toBeNull();
  });

  it('ReturnPath_ProtocolRelativeUrl_IsRefusedBecauseItLeavesTheOrigin', () => {
    expect(sanitiseReturnPath('//evil.test/steal')).toBeNull();
  });

  it('ReturnPath_BackslashForm_IsRefusedBecauseBrowsersTreatItAsASlash', () => {
    expect(sanitiseReturnPath('/\\evil.test')).toBeNull();
    expect(sanitiseReturnPath('\\\\evil.test')).toBeNull();
  });

  it('ReturnPath_JavascriptScheme_IsRefused', () => {
    expect(sanitiseReturnPath('javascript:alert(1)')).toBeNull();
  });

  it('ReturnPath_InternalRouteNotOnTheAllowList_IsRefused', () => {
    expect(sanitiseReturnPath('/organizer/organizer-dashboard')).toBeNull();
  });

  it('ReturnPath_JoinScreenWithAnAppendedQueryString_IsRefused', () => {
    expect(sanitiseReturnPath(`${JOIN_PATH}?next=https://evil.test`)).toBeNull();
  });

  it('ReturnPath_JoinScreenWithAMalformedCampaignId_IsRefused', () => {
    expect(sanitiseReturnPath('/donation/campaign/not-a-guid/peer-to-peer/join')).toBeNull();
  });

  it('ReturnPath_MissingOrBlank_IsRefused', () => {
    expect(sanitiseReturnPath(null)).toBeNull();
    expect(sanitiseReturnPath(undefined)).toBeNull();
    expect(sanitiseReturnPath('   ')).toBeNull();
  });
});

describe('withReturnPath', () => {
  it('WithReturnPath_AllowedPath_IsEncodedOntoTheDestination', () => {
    expect(withReturnPath('/auth/sign-in/custom', JOIN_PATH)).toBe(
      `/auth/sign-in/custom?returnPath=${encodeURIComponent(JOIN_PATH)}`,
    );
  });

  it('WithReturnPath_DestinationAlreadyHasAQuery_AppendsRatherThanReplaces', () => {
    expect(withReturnPath('/auth/sign-in/custom?mode=email', JOIN_PATH)).toContain(
      '?mode=email&returnPath=',
    );
  });

  it('WithReturnPath_RefusedPath_IsDroppedInsteadOfCarried', () => {
    expect(withReturnPath('/auth/sign-in/custom', 'https://evil.test')).toBe(
      '/auth/sign-in/custom',
    );
  });
});

describe('campaignFromReturnPath', () => {
  it('CampaignFromReturnPath_AllowedJoinPath_ReturnsTheCampaignId', () => {
    expect(campaignFromReturnPath(JOIN_PATH)).toBe(CAMPAIGN_ID);
  });

  it('CampaignFromReturnPath_RefusedPath_ReturnsNothing', () => {
    expect(campaignFromReturnPath('https://evil.test')).toBeNull();
    expect(campaignFromReturnPath(null)).toBeNull();
  });
});

describe('supporterSignUpPath', () => {
  it('SupporterSignUpPath_Campaign_MirrorsTheBackendRouteWithoutTheApiPrefix', () => {
    expect(supporterSignUpPath(CAMPAIGN_ID)).toBe(
      `/donation/campaign/${CAMPAIGN_ID}/peer-to-peer/supporter-sign-up`,
    );
  });

  it('SupporterSignUpPath_IsNotAReturnPathThisApplicationWillNavigateBackTo', () => {
    // Sign-up is a step on the way, never a destination to be sent to after signing in. Allowing it
    // there would let a crafted link loop someone through an account-creation form after they had
    // already authenticated.
    expect(sanitiseReturnPath(supporterSignUpPath(CAMPAIGN_ID))).toBeNull();
  });
});
