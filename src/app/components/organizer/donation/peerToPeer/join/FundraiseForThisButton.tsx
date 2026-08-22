import { Button, useDisclosure } from '@chakra-ui/react';
import { MdVolunteerActivism } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { ensureAuthenticated } from 'utils/auth';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import FundraiseAccessModal from '../access/FundraiseAccessModal';
import { JOIN_CTA } from './joinCopy';

interface FundraiseForThisButtonProps {
  campaignUniqueId: string;
  /** The campaign's own switch. Nothing renders when it is off, and the layout is unchanged. */
  isPeerToPeerEnabled: boolean;
}

/**
 * Screen 02's entry point into peer-to-peer. A signed-in supporter goes straight to the join screen.
 * Everyone else is offered both ways in without leaving the campaign, so nobody has to remember
 * whether they already have an account before they can start.
 */
export const FundraiseForThisButton = ({
  campaignUniqueId,
  isPeerToPeerEnabled,
}: FundraiseForThisButtonProps) => {
  const navigate = useNavigate();
  const access = useDisclosure();

  if (!isPeerToPeerEnabled || !campaignUniqueId) {
    return null;
  }

  const handleClick = () => {
    if (ensureAuthenticated()) {
      navigate(fundraiserJoinPath(campaignUniqueId));
      return;
    }

    access.onOpen();
  };

  return (
    <>
      <Button
        variant="outline"
        colorScheme="brand"
        minH="44px"
        w={{ base: 'full', md: 'auto' }}
        leftIcon={<MdVolunteerActivism />}
        onClick={handleClick}
        sx={{ cursor: 'pointer' }}
      >
        {JOIN_CTA}
      </Button>

      <FundraiseAccessModal
        campaignUniqueId={campaignUniqueId}
        isOpen={access.isOpen}
        onClose={access.onClose}
      />
    </>
  );
};

export default FundraiseForThisButton;
