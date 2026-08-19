import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdArrowOutward } from 'react-icons/md';
import { OrganizerCampaign } from 'app/interface/memberInter/discoverCampaignDto';
import { useNavigate } from 'react-router-dom';

interface CampaignCardProps {
  campaign: OrganizerCampaign;
  bannerUrl?: string | null;
}

// ── Derive category from name/description keywords ──
function deriveCategory(name: string, desc: string | null): string {
  const text = (name + ' ' + (desc ?? '')).toLowerCase();
  if (text.match(/water|flood|ocean|river|clean\s+water/)) return 'Water';
  if (text.match(/food|hunger|meal|feed|nutrition|ramadan/)) return 'Food';
  if (text.match(/school|educat|youth|learn|student|program.*usa/)) return 'Education';
  if (text.match(/tree|environ|green|plant|climate/)) return 'Environment';
  if (text.match(/animal|pet|shelter|rescue|wildlife/)) return 'Animals';
  if (text.match(/health|medical|hospital|healthcare/)) return 'Health';
  if (text.match(/child|kid|orphan|baby|infant/)) return 'Children';
  if (text.match(/emergency|relief|disaster|crisis/)) return 'Relief';
  return 'Campaign';
}

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Water:       ['#0694a2', '#00b5d8'],
  Food:        ['#c05621', '#ed8936'],
  Education:   ['#4318FF', '#7551FF'],
  Environment: ['#276749', '#38a169'],
  Animals:     ['#b7791f', '#d97706'],
  Health:      ['#c53030', '#e53e3e'],
  Children:    ['#553c9a', '#805ad5'],
  Relief:      ['#b7791f', '#ed8936'],
  Campaign:    ['#4318FF', '#9f7aea'],
};

function getDaysLeft(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

function formatAmount(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `$${val}`;
}

function CampaignCard({ campaign, bannerUrl }: CampaignCardProps) {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');

  const category = deriveCategory(campaign.campaignName, campaign.description);
  const [colorFrom, colorTo] = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.Campaign;
  const daysLeft = getDaysLeft(campaign.endDate);
  const goalAchieved = campaign.goal?.goalAchieved ?? 0;
  const goalAmount = campaign.goal?.goal ?? campaign.fundRaisingGoal;
  const progressPercent = goalAmount > 0 ? Math.min(100, (goalAchieved / goalAmount) * 100) : 0;

  return (
    <Box
      bg={cardBg}
      borderRadius="20px"
      overflow="hidden"
      border="1px solid"
      borderColor={useColorModeValue('purple.100', 'whiteAlpha.100')}
      boxShadow="0 1px 3px 0 rgba(29, 33, 43, 0.06)"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
      transition="all 0.25s"
      cursor="pointer"
      onClick={() => navigate(`/donate/${campaign.campaignUniqueId}`)}
      display="flex"
      flexDirection="column"
    >
      {/* ── Banner ── */}
      <Box
        position="relative"
        h="160px"
        flexShrink={0}
        bgGradient={`linear(135deg, ${colorFrom} 0%, ${colorTo} 100%)`}
        overflow="hidden"
      >
        <Image
          position="absolute"
          top={0} left={0}
          src={bannerUrl ?? '/donation.jpg'}
          alt={campaign.campaignName}
          w="100%" h="100%"
          objectFit="cover"
          fallbackSrc="/donation.jpg"
        />

        {/* dark bottom gradient for text readability */}
        <Box
          position="absolute"
          bottom={0} left={0} right={0}
          h="70px"
          bgGradient="linear(to-t, blackAlpha.700, transparent)"
        />

        {/* Status badge — top-right */}
        <Badge
          position="absolute"
          top="10px"
          right="10px"
          bg="blackAlpha.600"
          color="white"
          borderRadius="full"
          px="10px"
          py="3px"
          fontSize="10px"
          fontWeight="600"
          textTransform="capitalize"
        >
          {campaign.status}
        </Badge>

        {/* Category badge — bottom-left */}
        <Badge
          position="absolute"
          bottom="10px"
          left="10px"
          bg="blackAlpha.700"
          color="white"
          borderRadius="full"
          px="10px"
          py="3px"
          fontSize="10px"
          fontWeight="700"
          textTransform="capitalize"
        >
          {category}
        </Badge>

        {/* Days left — bottom-right */}
        <Text
          position="absolute"
          bottom="12px"
          right="12px"
          color="whiteAlpha.900"
          fontSize="10px"
          fontWeight="600"
        >
          {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
        </Text>
      </Box>

      {/* ── Card Body ── */}
      <Box p="16px" flex={1} display="flex" flexDirection="column">
        <Text
          fontSize="10px"
          fontWeight="700"
          color="brand.500"
          textTransform="uppercase"
          letterSpacing="0.08em"
          mb="4px"
          noOfLines={1}
        >
          {campaign.organizerName}
        </Text>

        <Text
          color={textColor}
          fontWeight="700"
          fontSize="sm"
          lineHeight="1.4"
          noOfLines={2}
          minH="2.8em"
          mb="12px"
        >
          {campaign.campaignName}
        </Text>

        {/* Progress bar */}
        <Box bg={useColorModeValue('gray.100', 'whiteAlpha.100')} borderRadius="full" h="4px" mb="10px">
          <Box w={`${progressPercent}%`} h="4px" borderRadius="full" bg="brand.500" />
        </Box>

        <Flex justify="space-between" align="center" mb="0">
          <Text fontSize="sm" fontWeight="700" color={textColor}>
            {formatAmount(goalAchieved)}
          </Text>
          <Text fontSize="xs" color={subColor}>
            of {formatAmount(goalAmount)}
          </Text>
        </Flex>

        <Box mt="auto" pt="12px" borderTop="1px solid" borderColor={useColorModeValue('gray.100', 'whiteAlpha.100')} />

        <Flex justify="flex-end" mt="10px">
          <Button
            size="sm"
            colorScheme="brand"
            borderRadius="10px"
            px="16px"
            rightIcon={<Icon as={MdArrowOutward} w="13px" h="13px" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/donate/${campaign.campaignUniqueId}`);
            }}
          >
            Donate
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}

export default CampaignCard;
