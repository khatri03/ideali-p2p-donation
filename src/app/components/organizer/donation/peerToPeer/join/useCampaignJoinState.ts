import { useEffect, useState } from 'react';
import { FundraiserJoinContext } from 'app/interface/donationInter/fundraiserJoinDto';
import { getFundraiserJoinContext } from 'app/service/organizer/donation/fundraiserJoinService';
import { ensureAuthenticated } from 'utils/auth';

/**
 * What the campaign page is allowed to offer this particular viewer.
 *
 * `invite` is the state a stranger and a supporter with no page here both land in, so a signed-out
 * visitor is never made to wait for a request that could not tell us anything about them anyway.
 */
export type CampaignJoinState =
  | { kind: 'unknown' }
  | { kind: 'invite' }
  | { kind: 'fundraising'; pageAddress: string }
  | { kind: 'awaitingApproval'; pageAddress: string }
  | { kind: 'silent' };

const pageAddress = (context: FundraiserJoinContext): string | null => {
  if (!context.slug) {
    return null;
  }

  return context.campaignSlug
    ? `/campaigns/${context.campaignSlug}/${context.slug}`
    : `/campaigns/${context.slug}`;
};

const stateFor = (context: FundraiserJoinContext): CampaignJoinState => {
  if (context.blockedKind === 'RunsThisCampaign') {
    // Whoever runs the campaign also decides which pages on it go live, so the server refuses them a
    // page of their own. Offering it here would be an invitation to a screen that says no.
    return { kind: 'silent' };
  }

  if (!context.alreadyJoined) {
    return { kind: 'invite' };
  }

  const address = pageAddress(context);

  if (!address) {
    return { kind: 'silent' };
  }

  switch (context.currentStatus) {
    case 'Active':
      return { kind: 'fundraising', pageAddress: address };
    case 'PendingApproval':
      return { kind: 'awaitingApproval', pageAddress: address };
    default:
      // Paused and turned down are told by email and written plainly on the supporter's own console.
      // A campaign page a friend may be reading over their shoulder is not the place to repeat it.
      return { kind: 'silent' };
  }
};

/**
 * Reads the viewer's own standing on one campaign so the invitation can tell them the truth.
 *
 * A request that fails leaves the invitation in place: the join screen refuses a second page on its
 * own, so the worst outcome is the wording we have today rather than a supporter locked out of a
 * campaign by a network error.
 */
export const useCampaignJoinState = (
  campaignUniqueId: string,
  isPeerToPeerEnabled: boolean,
): CampaignJoinState => {
  const [state, setState] = useState<CampaignJoinState>({ kind: 'unknown' });

  useEffect(() => {
    if (!isPeerToPeerEnabled || !campaignUniqueId) {
      setState({ kind: 'unknown' });
      return undefined;
    }

    if (!ensureAuthenticated()) {
      setState({ kind: 'invite' });
      return undefined;
    }

    let isActive = true;
    setState({ kind: 'unknown' });

    getFundraiserJoinContext(campaignUniqueId)
      .then((context) => {
        if (isActive) {
          setState(stateFor(context));
        }
      })
      .catch(() => {
        if (isActive) {
          setState({ kind: 'invite' });
        }
      });

    return () => {
      isActive = false;
    };
  }, [campaignUniqueId, isPeerToPeerEnabled]);

  return state;
};
