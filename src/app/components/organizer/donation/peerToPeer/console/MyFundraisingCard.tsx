import {
  Avatar,
  Badge,
  Box,
  Button,
  Heading,
  Progress,
  Stack,
  Text,
} from '@chakra-ui/react';
import { MyFundraisingPage } from 'app/interface/donationInter/fundraiserConsoleDto';
import { fundraiserPhotoUrl } from 'app/service/organizer/donation/fundraiserConsoleService';
import { formatMoney, goalPercentage } from '../page/money';
import { donorSummary, initialsOf, raisedSummary } from '../page/pageCopy';
import RecentSupportersPanel from '../page/RecentSupportersPanel';
import SharePanel from '../page/SharePanel';
import {
  CAMPAIGN_CLOSED_NOTE,
  EDIT_PAGE,
  STATUS_LABELS,
  STATUS_NOTES,
  VIEW_PUBLIC_PAGE,
} from './consoleCopy';

interface MyFundraisingCardProps {
  page: MyFundraisingPage;
  shareUrl: string;
  onView: () => void;
  onEdit: () => void;
}

const statusColorScheme = (page: MyFundraisingPage) => {
  if (!page.isCampaignOpen) {
    return 'gray';
  }

  return page.currentStatus === 'Active' ? 'green' : 'orange';
};

/**
 * One page a supporter owns: where it stands, what it has raised, the link to send, and the two
 * actions worth offering. Presentational only - it takes a page and renders it.
 */
export const MyFundraisingCard = ({ page, shareUrl, onView, onEdit }: MyFundraisingCardProps) => {
  const percentage = goalPercentage(page.raisedAmount, page.goal);
  const statusNote = page.isCampaignOpen ? STATUS_NOTES[page.currentStatus] : CAMPAIGN_CLOSED_NOTE;

  return (
    <Box
      bg="white"
      _dark={{ bg: 'navy.700' }}
      borderRadius="16px"
      boxShadow="sm"
      p={{ base: 4, md: 6 }}
    >
      <Stack gap={{ base: 4, md: 6 }}>
        <Stack direction={{ base: 'column', '2sm': 'row' }} gap={4} align={{ '2sm': 'center' }}>
          <Avatar
            name={page.displayName}
            src={page.photoUniqueId ? fundraiserPhotoUrl(page.photoUniqueId) : undefined}
            getInitials={() => initialsOf(page.displayName)}
            size="lg"
            bg="brand.500"
            color="white"
          />

          <Stack gap={2} flex="1" minW={0}>
            <Heading
              as="h2"
              fontSize={{ base: 'lg', md: 'xl' }}
              color="navy.700"
              _dark={{ color: 'white' }}
            >
              {page.campaignName}
            </Heading>

            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {`${page.displayName} for ${page.organizerName}`}
            </Text>

            <Stack direction="row" gap={2} flexWrap="wrap">
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
        </Stack>

        {statusNote && (
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
            {statusNote}
          </Text>
        )}

        <Stack gap={2}>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="navy.700" _dark={{ color: 'white' }}>
            {raisedSummary(
              formatMoney(page.raisedAmount, page.currencySymbol),
              page.goal ? formatMoney(page.goal, page.currencySymbol) : null,
            )}
          </Text>

          {percentage !== null && (
            <>
              <Progress
                value={percentage}
                size="sm"
                colorScheme="brand"
                borderRadius="full"
                aria-label={`${percentage}% of goal raised`}
              />
              <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
                {`${percentage}%`}
              </Text>
            </>
          )}

          <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
            {donorSummary(page.donorCount)}
          </Text>
        </Stack>

        <Stack direction={{ base: 'column', md: 'row' }} gap={3}>
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

          <Button
            onClick={onView}
            variant="outline"
            colorScheme="brand"
            minH="44px"
            borderRadius="12px"
            cursor="pointer"
            w={{ base: 'full', md: 'auto' }}
          >
            {VIEW_PUBLIC_PAGE}
          </Button>
        </Stack>

        <SharePanel displayName={page.displayName} shareUrl={shareUrl} />

        <RecentSupportersPanel
          supporters={page.recentSupporters}
          currencySymbol={page.currencySymbol}
        />
      </Stack>
    </Box>
  );
};

export default MyFundraisingCard;
