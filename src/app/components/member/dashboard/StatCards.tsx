import { Box, Flex, Grid, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { MdAttachMoney, MdTrendingUp, MdCampaign, MdGroups } from 'react-icons/md';
import { DonorDashboardSummary } from 'app/interface/memberInter/donorDashboardDto';

interface StatCardProps {
  icon: any;
  iconBg: string;
  label: string;
  value: string;
  subLabel?: string;
}

function StatCard({ icon, iconBg, label, value, subLabel }: StatCardProps) {
  const cardBg = useColorModeValue('white', 'navy.800');
  const labelColor = useColorModeValue('#A3AED0', '#A3AED0');
  const valueColor = useColorModeValue('#1B2559', 'white');

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      p="24px"
      boxShadow="sm"
      border="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      transition="all 0.2s"
      _hover={{ boxShadow: 'md' }}
    >
      <Flex justify="space-between" align="flex-start" mb="16px">
        <Box
          bg={iconBg}
          borderRadius="12px"
          w="52px"
          h="52px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon as={icon} w="26px" h="26px" color="white" />
        </Box>
      </Flex>
      <Text color={valueColor} fontSize="xl" fontWeight="700" mb="4px" lineHeight="1">
        {value}
      </Text>
      <Text color={labelColor} fontSize="sm" fontWeight="500" mt="6px">{label}</Text>
      {subLabel && (
        <Text color={labelColor} fontSize="xs" mt="2px">{subLabel}</Text>
      )}
    </Box>
  );
}

interface StatCardsProps {
  summary: DonorDashboardSummary;
}

function StatCards({ summary }: StatCardsProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <Grid templateColumns={{ base: '1fr 1fr', xl: 'repeat(4, 1fr)' }} gap="20px" mb="24px">
      <StatCard
        icon={MdAttachMoney}
        iconBg="blue.400"
        label="Total Donated Lifetime"
        value={fmt(summary.lifetimeTotalDonationAmount)}
      //subLabel={`${summary.lifetimeTotalDonations} donation${summary.lifetimeTotalDonations !== 1 ? 's' : ''}`}
      />
      <StatCard
        icon={MdTrendingUp}
        iconBg="green.400"
        label="Total Donated Ytd"
        value={fmt(summary.currentYearTotalDonationAmount)}
      //subLabel={`${summary.currentYearTotalDonations} donation${summary.currentYearTotalDonations !== 1 ? 's' : ''}`}
      />
      <StatCard
        icon={MdCampaign}
        iconBg="orange.400"
        label="Campaigns Supported"
        value={String(summary.totalDonationCampaigns)}
      />
      <StatCard
        icon={MdGroups}
        iconBg="purple.400"
        label="Organizations Supported"
        value={String(summary.totalOrganizers)}
      />
    </Grid>
  );
}

export default StatCards;
