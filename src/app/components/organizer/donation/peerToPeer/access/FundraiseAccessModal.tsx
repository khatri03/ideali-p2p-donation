import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { ACCESS_HEADING } from './accessCopy';
import FundraiseAccessPanel, {
  FundraiseAccessPanelProps,
  SIGN_IN_TAB_INDEX,
} from './FundraiseAccessPanel';

interface FundraiseAccessModalProps extends FundraiseAccessPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * What a visitor sees when they ask to fundraise for a campaign without a session.
 *
 * A dialog is the right shape where the person interrupted something to get here — the join screen
 * sits behind it and is what they return to. Screens that have their own reason to stay visible use
 * {@link FundraiseAccessPanel} directly instead.
 */
export const FundraiseAccessModal = ({
  isOpen,
  onClose,
  initialTabIndex = SIGN_IN_TAB_INDEX,
  ...panel
}: FundraiseAccessModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} isCentered>
    <ModalOverlay />
    <ModalContent borderRadius={{ base: 0, md: '16px' }}>
      <ModalHeader fontSize={{ base: 'lg', md: 'xl' }}>{ACCESS_HEADING}</ModalHeader>
      <ModalCloseButton minH="44px" minW="44px" sx={{ cursor: 'pointer' }} />

      <ModalBody pb={6}>
        <FundraiseAccessPanel {...panel} initialTabIndex={initialTabIndex} />
      </ModalBody>
    </ModalContent>
  </Modal>
);

export default FundraiseAccessModal;
