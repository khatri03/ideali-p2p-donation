import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import CampaignContextBanner from '../join/CampaignContextBanner';
import { ACCESS_HEADING, SIGN_IN_TAB, SIGN_UP_TAB } from './accessCopy';
import SupporterSignInPanel from './SupporterSignInPanel';
import SupporterSignUpPanel from './SupporterSignUpPanel';
import { useSupporterSignIn } from './useSupporterSignIn';

interface FundraiseAccessModalProps {
  campaignUniqueId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Which tab opens first. Someone who has just confirmed an address arrives ready to sign in. */
  initialTabIndex?: number;
}

/**
 * What a visitor sees when they ask to fundraise for a campaign without a session.
 *
 * Both ways in are offered side by side rather than as two screens, because a person who does not
 * remember whether they already have an account should not have to guess before they can start.
 * Signing in returns them to the fundraising page they asked for; creating an account does not sign
 * them in, because the address is not proven until the emailed link is followed.
 */
export const FundraiseAccessModal = ({
  campaignUniqueId,
  isOpen,
  onClose,
  initialTabIndex = 0,
}: FundraiseAccessModalProps) => {
  const signIn = useSupporterSignIn(fundraiserJoinPath(campaignUniqueId));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, md: '16px' }}>
        <ModalHeader fontSize={{ base: 'lg', md: 'xl' }}>{ACCESS_HEADING}</ModalHeader>
        <ModalCloseButton minH="44px" minW="44px" sx={{ cursor: 'pointer' }} />

        <ModalBody pb={6}>
          <CampaignContextBanner
            campaignUniqueId={campaignUniqueId}
            action="Sign in"
            afterwardsNote="You will land straight on your fundraising page."
          />

          {/* Only the open tab is mounted. Rendering both would put two email fields in the page at
              once, which reads as two separate forms to anyone using a screen reader. */}
          <Tabs colorScheme="brand" defaultIndex={initialTabIndex} isFitted isLazy>
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
                <SupporterSignInPanel signIn={signIn} />
              </TabPanel>
              <TabPanel px={0}>
                <SupporterSignUpPanel campaignUniqueId={campaignUniqueId} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default FundraiseAccessModal;
