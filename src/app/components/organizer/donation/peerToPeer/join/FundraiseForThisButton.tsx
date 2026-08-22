import { Button } from '@chakra-ui/react';
import { MdVolunteerActivism } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { ensureAuthenticated } from 'utils/auth';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import { signInRouteFor } from 'app/utils/session';
import { JOIN_CTA } from './joinCopy';

interface FundraiseForThisButtonProps {
  campaignUniqueId: string;
  /** The campaign's own switch. Nothing renders when it is off, and the layout is unchanged. */
  isPeerToPeerEnabled: boolean;
}

/**
 * Screen 02's entry point into peer-to-peer. A signed-in supporter goes straight to the join screen;
 * a signed-out visitor goes to sign in with the join screen carried as the return path, so they are
 * not dropped on a dashboard having forgotten what they came to do.
 */
export const FundraiseForThisButton = ({
  campaignUniqueId,
  isPeerToPeerEnabled,
}: FundraiseForThisButtonProps) => {
  const navigate = useNavigate();

  if (!isPeerToPeerEnabled || !campaignUniqueId) {
    return null;
  }

  const joinPath = fundraiserJoinPath(campaignUniqueId);

  return (
    <Button
      variant="outline"
      colorScheme="brand"
      minH="44px"
      w={{ base: 'full', md: 'auto' }}
      leftIcon={<MdVolunteerActivism />}
      onClick={() => navigate(ensureAuthenticated() ? joinPath : signInRouteFor(joinPath))}
      sx={{ cursor: 'pointer' }}
    >
      {JOIN_CTA}
    </Button>
  );
};

export default FundraiseForThisButton;
