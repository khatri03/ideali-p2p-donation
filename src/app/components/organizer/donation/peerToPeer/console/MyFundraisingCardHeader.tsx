import { Badge, Stack, Text } from '@chakra-ui/react';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { formatMoney } from '../page/money';
import { raisedSummary } from '../page/pageCopy';
import { FUNDRAISING_PAGE_PREFIX, STATUS_LABELS } from './consoleCopy';

interface MyFundraisingCardHeaderProps {
  page: MyFundraisingPage;
}

/**
 * A closed campaign is neither a warning nor a success, so its page loses the colour rather than
 * borrowing one that would read as a state the charity has put it in.
 */
const statusColorScheme = (page: MyFundraisingPage) => {
  if (!page.isCampaignOpen) {
    return 'gray';
  }

  return page.currentStatus === 'Active' ? 'green' : 'orange';
};

/**
 * What one campaign says while its section is shut.
 *
 * A collapsed row still has to answer the two questions somebody opened this screen for - which
 * campaign, and how it is going - or collapsing has hidden the point of the screen rather than the
 * noise around it. So the money and the goal sit in the header beside the campaign name, and only the
 * things a supporter acts on are behind the disclosure.
 *
 * The campaign leads here, unlike on the page itself, because the sections are the campaigns: a list
 * whose rows are named after something other than what groups them is a list nobody can scan.
 */
export const MyFundraisingCardHeader = ({ page }: MyFundraisingCardHeaderProps) => (
  <Stack
    direction={{ base: 'column', md: 'row' }}
    gap={{ base: 2, md: 4 }}
    align={{ base: 'flex-start', md: 'center' }}
    flex="1"
    minW={0}
    textAlign="left"
  >
    <Stack gap={0.5} flex="1" minW={0}>
      <Text
        fontSize={{ base: 'md', md: 'lg' }}
        fontWeight="bold"
        color="navy.700"
        _dark={{ color: 'white' }}
      >
        {page.campaignName}
      </Text>

      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
        {`${FUNDRAISING_PAGE_PREFIX} ${page.displayName}`}
      </Text>
    </Stack>

    <Stack
      direction="row"
      gap={3}
      align="center"
      flexWrap="wrap"
      flexShrink={0}
    >
      <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="600" color="navy.700" _dark={{ color: 'white' }}>
        {raisedSummary(
          formatMoney(page.raisedAmount, page.currencySymbol),
          page.goal ? formatMoney(page.goal, page.currencySymbol) : null,
        )}
      </Text>

      <Badge
        colorScheme={statusColorScheme(page)}
        borderRadius="full"
        px={3}
        py={1}
        textTransform="none"
      >
        {STATUS_LABELS[page.currentStatus]}
      </Badge>
    </Stack>
  </Stack>
);

export default MyFundraisingCardHeader;
