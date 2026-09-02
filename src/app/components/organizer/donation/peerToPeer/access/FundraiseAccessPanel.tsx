import { useState } from 'react';
import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import CampaignContextBanner from '../join/CampaignContextBanner';
import {
  BANNER_SIGN_IN_ACTION,
  BANNER_SIGN_IN_NOTE,
  BANNER_SIGN_UP_ACTION,
  BANNER_SIGN_UP_NOTE,
  SIGN_IN_TAB,
  SIGN_UP_TAB,
} from './accessCopy';
import SupporterSignInPanel from './SupporterSignInPanel';
import SupporterSignUpPanel from './SupporterSignUpPanel';
import { useSupporterSignIn } from './useSupporterSignIn';

export const SIGN_IN_TAB_INDEX = 0;
export const SIGN_UP_TAB_INDEX = 1;

export interface FundraiseAccessPanelProps {
  campaignUniqueId: string;
  /** Which tab opens first. Someone who has just confirmed an address arrives ready to sign in. */
  initialTabIndex?: number;
  /**
   * Where signing in lands. Defaults to the join screen, which is where someone who followed a
   * campaign's own fundraise link was heading. An invitation passes its own path so the person comes
   * back to the invitation and it is recorded as accepted rather than merely opened.
   */
  returnPath?: string;
  /** The address an invitation was sent to, when there was one. Fixes the sign-up address. */
  invitedEmailAddress?: string;
  /** The invitation being accepted, so the confirmation email leads back to it. */
  invitationToken?: string;
  /**
   * Whether to name the campaign above the tabs. False where the surrounding screen has already said
   * which campaign this is, so the name is not printed twice on one page.
   */
  hasCampaignBanner?: boolean;
}

/**
 * Both ways in to fundraising, side by side.
 *
 * Offering only one of them is the defect this exists to prevent: someone the charity invited by
 * email has no account yet by definition, and a screen that shows them a sign-in form alone leaves
 * them to work out for themselves that they need to create one first.
 */
export const FundraiseAccessPanel = ({
  campaignUniqueId,
  initialTabIndex = SIGN_IN_TAB_INDEX,
  returnPath,
  invitedEmailAddress,
  invitationToken,
  hasCampaignBanner = true,
}: FundraiseAccessPanelProps) => {
  const destination = returnPath ?? fundraiserJoinPath(campaignUniqueId);
  const signIn = useSupporterSignIn(destination);
  const [openTabIndex, setOpenTabIndex] = useState(initialTabIndex);
  const isSigningIn = openTabIndex === SIGN_IN_TAB_INDEX;

  return (
    <Stack gap={0} minW={0}>
      {hasCampaignBanner && (
        <CampaignContextBanner
          campaignUniqueId={campaignUniqueId}
          action={isSigningIn ? BANNER_SIGN_IN_ACTION : BANNER_SIGN_UP_ACTION}
          afterwardsNote={isSigningIn ? BANNER_SIGN_IN_NOTE : BANNER_SIGN_UP_NOTE}
        />
      )}

      {/* Only the open tab is mounted. Rendering both would put two email fields in the page at
          once, which reads as two separate forms to anyone using a screen reader. */}
      <Tabs colorScheme="brand" index={openTabIndex} onChange={setOpenTabIndex} isFitted isLazy>
        <TabList mb={5}>
          <Tab minH="44px" sx={{ cursor: 'pointer' }}>
            {SIGN_IN_TAB}
          </Tab>
          <Tab minH="44px" sx={{ cursor: 'pointer' }}>
            {SIGN_UP_TAB}
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <SupporterSignInPanel
              signIn={signIn}
              onSwitchToSignUp={() => setOpenTabIndex(SIGN_UP_TAB_INDEX)}
            />
          </TabPanel>
          <TabPanel px={0}>
            <SupporterSignUpPanel
              campaignUniqueId={campaignUniqueId}
              invitedEmailAddress={invitedEmailAddress}
              invitationToken={invitationToken}
              onSwitchToSignIn={() => setOpenTabIndex(SIGN_IN_TAB_INDEX)}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  );
};

export default FundraiseAccessPanel;
