import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import Card from 'themeComponents/card/Card';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import CopyLinkButton from '../page/CopyLinkButton';
import FundraiserAvatar from '../page/FundraiserAvatar';
import RecentSupportersPanel from '../page/RecentSupportersPanel';
import MyFundraisingCardHeader from './MyFundraisingCardHeader';
import MyFundraisingProgress from './MyFundraisingProgress';
import MyTeamAction from './MyTeamAction';
import ViewPublicPageLink from './ViewPublicPageLink';
import {
  CAMPAIGN_CLOSED_NOTE,
  EDIT_PAGE,
  fundraisingCardLabel,
  STATUS_NOTES,
} from './consoleCopy';

interface MyFundraisingCardProps {
  page: MyFundraisingPage;
  shareUrl: string;
  onEdit: () => void;
  onOpenTeams: (path: string) => void;
}

/**
 * One campaign a supporter is fundraising for, as a section that opens.
 *
 * The header is the whole row rather than a name with a separate control, so the target is the size of
 * the card on a phone instead of a chevron somebody has to aim at. Everything a supporter acts on -
 * editing, opening, sending the link, the team, the donations received - lives behind the disclosure,
 * and everything they only read lives in the header, which is what makes a shut section still worth
 * looking at.
 *
 * The heading wraps the control rather than sitting beside it, so the screen's outline is one heading
 * per campaign and the same element both names the section and opens it.
 */
export const MyFundraisingCard = ({
  page,
  shareUrl,
  onEdit,
  onOpenTeams,
}: MyFundraisingCardProps) => {
  const statusNote = page.isCampaignOpen ? STATUS_NOTES[page.currentStatus] : CAMPAIGN_CLOSED_NOTE;

  return (
    <Card
      as="section"
      aria-label={fundraisingCardLabel(page.displayName, page.campaignName)}
      p={0}
      overflow="hidden"
    >
      <AccordionItem border="none">
        <Heading as="h2" m={0}>
          <AccordionButton
            px={{ base: 4, md: 6 }}
            py={4}
            minH="44px"
            cursor="pointer"
            borderRadius="20px"
            _hover={{ bg: 'secondaryGray.300' }}
            _dark={{ _hover: { bg: 'whiteAlpha.100' } }}
          >
            <MyFundraisingCardHeader page={page} />
            <AccordionIcon ml={3} color="gray.500" />
          </AccordionButton>
        </Heading>

        <AccordionPanel px={{ base: 4, md: 6 }} pt={0} pb={{ base: 4, md: 6 }}>
          <Stack gap={{ base: 4, md: 5 }}>
            <Stack direction="row" gap={4} align="center">
              <FundraiserAvatar
                displayName={page.displayName}
                photoUrl={page.photoUniqueId ? fundraiserPhotoUrl(page.photoUniqueId) : null}
                size="48px"
              />
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                {page.organizerName}
              </Text>
            </Stack>

            {statusNote && (
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                {statusNote}
              </Text>
            )}

            <MyFundraisingProgress page={page} />

            <Stack direction={{ base: 'column', md: 'row' }} gap={3} flexWrap="wrap">
              <Button
                onClick={onEdit}
                colorScheme="brand"
                minH="44px"
                borderRadius="12px"
                cursor="pointer"
                w={{ base: 'full', md: 'auto' }}
              >
                {EDIT_PAGE}
              </Button>

              <ViewPublicPageLink shareUrl={shareUrl} />

              <CopyLinkButton shareUrl={shareUrl} />
            </Stack>

            <MyTeamAction page={page} onOpen={onOpenTeams} />

            <RecentSupportersPanel
              supporters={page.recentSupporters}
              currencySymbol={page.currencySymbol}
              headingLevel="h3"
              isNested
            />
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    </Card>
  );
};

export default MyFundraisingCard;
