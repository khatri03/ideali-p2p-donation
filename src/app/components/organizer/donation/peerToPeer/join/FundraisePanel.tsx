import { Box, Button, Skeleton, SkeletonText, Text, useDisclosure } from '@chakra-ui/react';
import { MdHourglassTop, MdVolunteerActivism } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { ensureAuthenticated } from 'utils/auth';
import { fundraiserJoinPath } from 'app/utils/returnPath';
import FundraiseAccessModal from '../access/FundraiseAccessModal';
import {
  ALREADY_FUNDRAISING_BODY,
  ALREADY_FUNDRAISING_CTA,
  ALREADY_FUNDRAISING_HEADING,
  AWAITING_APPROVAL_BODY,
  AWAITING_APPROVAL_CTA,
  AWAITING_APPROVAL_HEADING,
  FUNDRAISE_PANEL_INVITE_BODY,
  JOIN_CTA,
  JOIN_HEADING,
} from './joinCopy';
import { useCampaignJoinState } from './useCampaignJoinState';

interface FundraisePanelProps {
  campaignUniqueId: string;
  /** The campaign's own switch. Nothing renders when it is off, and the layout is unchanged. */
  isPeerToPeerEnabled: boolean;
  /**
   * The colour the charity chose for this campaign. Every other surface on the page is drawn in it, so
   * a panel in the product's own brand colour would read as an advertisement rather than part of the
   * campaign.
   */
  themeColor: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
}

/** The panel is a card of its own, so a control narrower than it leaves dead space beside itself. */
const CONTROL_WIDTH = 'full';

/** A tint of the campaign colour, matching how the banner already derives its own overlay from it. */
const HOVER_TINT_ALPHA = '14';

const WORDING: Record<'invite' | 'fundraising' | 'awaitingApproval', {
  heading: string;
  body: string;
  action: string;
}> = {
  invite: { heading: JOIN_HEADING, body: FUNDRAISE_PANEL_INVITE_BODY, action: JOIN_CTA },
  fundraising: {
    heading: ALREADY_FUNDRAISING_HEADING,
    body: ALREADY_FUNDRAISING_BODY,
    action: ALREADY_FUNDRAISING_CTA,
  },
  awaitingApproval: {
    heading: AWAITING_APPROVAL_HEADING,
    body: AWAITING_APPROVAL_BODY,
    action: AWAITING_APPROVAL_CTA,
  },
};

/**
 * Screen 02's entry point into peer-to-peer, worded for the person actually looking at it. A supporter
 * with no page is invited, one who already has a page is taken back to it, and one waiting on the
 * charity is told so. A page the charity paused or turned down is not mentioned on a public screen at
 * all: that decision reaches the supporter by email and on their own console, where the wording can
 * also say what to do about it.
 *
 * It is a panel rather than a lone button, and it sits above the campaign story rather than below it,
 * because a description has no length limit: a button underneath one is only ever seen by a reader who
 * reached the end, while the campaign's own donate card is in view from the first moment.
 */
export const FundraisePanel = ({
  campaignUniqueId,
  isPeerToPeerEnabled,
  themeColor,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
}: FundraisePanelProps) => {
  const navigate = useNavigate();
  const access = useDisclosure();
  const joinState = useCampaignJoinState(campaignUniqueId, isPeerToPeerEnabled);

  if (!isPeerToPeerEnabled || !campaignUniqueId || joinState.kind === 'silent') {
    return null;
  }

  const shell = (children: React.ReactNode) => (
    <Box
      p={5}
      borderRadius="xl"
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      boxShadow="lg"
    >
      {children}
    </Box>
  );

  if (joinState.kind === 'unknown') {
    // Drawn as the panel it becomes, so the campaign page never jumps once the answer arrives.
    return shell(
      <>
        <Skeleton h="24px" w="60%" borderRadius="md" />
        <SkeletonText mt={3} noOfLines={2} spacing={2} skeletonHeight="12px" />
        <Skeleton mt={4} h="44px" w={CONTROL_WIDTH} borderRadius="md" />
      </>,
    );
  }

  const { heading, body, action } = WORDING[joinState.kind];
  const isWaiting = joinState.kind === 'awaitingApproval';
  const ownPageAddress = 'pageAddress' in joinState ? joinState.pageAddress : null;

  const handleClick = () => {
    if (ownPageAddress) {
      navigate(ownPageAddress);
      return;
    }

    if (ensureAuthenticated()) {
      navigate(fundraiserJoinPath(campaignUniqueId));
      return;
    }

    access.onOpen();
  };

  return (
    <>
      {shell(
        <>
          <Text as="h2" fontSize="lg" fontWeight="semibold" color={textColor}>
            {heading}
          </Text>
          <Text mt={2} fontSize="sm" color={subTextColor} lineHeight="1.7">
            {body}
          </Text>
          <Button
            mt={4}
            variant="outline"
            minH="44px"
            w={CONTROL_WIDTH}
            color={themeColor}
            borderColor={themeColor}
            _hover={{ bg: `${themeColor}${HOVER_TINT_ALPHA}` }}
            _active={{ bg: `${themeColor}${HOVER_TINT_ALPHA}` }}
            leftIcon={isWaiting ? <MdHourglassTop /> : <MdVolunteerActivism />}
            onClick={handleClick}
            sx={{ cursor: 'pointer' }}
          >
            {action}
          </Button>
        </>,
      )}

      {joinState.kind === 'invite' && (
        <FundraiseAccessModal
          campaignUniqueId={campaignUniqueId}
          isOpen={access.isOpen}
          onClose={access.onClose}
        />
      )}
    </>
  );
};

export default FundraisePanel;
