import React, { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, SimpleGrid, Skeleton,
  useColorModeValue, Icon,
} from '@chakra-ui/react';
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import membershipAnalyticsService, { MembershipDistributionData, DistributionSlice } from 'app/service/organizer/membership/membershipAnalyticsService';
import dollarIcon from 'assets/img/dashboards/organizer/dollar.svg';
import memberIcon from 'assets/img/dashboards/member.svg';
import revenueIcon from 'assets/img/dashboards/organizer/revenue.svg';

ChartJS.register(ArcElement, Tooltip, Legend);

const SLICE_COLORS = ['#F59F0A', '#3B82F6', '#8749DF', '#10B981', '#EF4444', '#EC4899', '#14B8A6', '#6B7280'];

interface CardDef {
  value: string;
  subtitle: string;
  iconSrc: string;
  iconNeedsWrapper: boolean;
  trend?: { value: string; isPositive: boolean } | null;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toFixed(2)}`;
};

const computeTrend = (current: number, last: number): { value: string; isPositive: boolean } | null => {
  if (last === 0 && current === 0) return null;
  if (last === 0) return { value: 'New', isPositive: true };
  const pct = ((current - last) / last) * 100;
  return { value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, isPositive: pct >= 0 };
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const AnalyticsStatCard: React.FC<CardDef> = ({ value, subtitle, iconSrc, iconNeedsWrapper, trend }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={5}
      boxShadow="sm"
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: 'md' }}
      h="100%"
    >
      <Flex direction="column" h="100%" justify="space-between" gap={4}>
        {/* Top: icon + trend badge */}
        <Flex justify="space-between" align="flex-start">
          {iconNeedsWrapper ? (
            <Box
              bg="#7c3aed"
              borderRadius="lg"
              w="38px"
              h="38px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <img src={iconSrc} alt="" width={22} height={22} />
            </Box>
          ) : (
            <img src={iconSrc} alt="" width={38} height={38} style={{ display: 'block' }} />
          )}
          {trend && (
            <Flex
              align="center"
              gap={0.5}
              bg={trend.isPositive ? 'green.50' : 'red.50'}
              color={trend.isPositive ? 'green.600' : 'red.500'}
              px={2}
              py={1}
              borderRadius="md"
              fontSize="xs"
              fontWeight="bold"
            >
              <Icon as={trend.isPositive ? MdTrendingUp : MdTrendingDown} boxSize={3.5} />
              {trend.value}
            </Flex>
          )}
        </Flex>

        {/* Bottom: value + label */}
        <Box>
          <Text fontSize="3xl" fontWeight="extrabold" color={textColor} lineHeight="1.1" mb={1}>
            {value}
          </Text>
          <Text fontSize="sm" color={subtitleColor}>
            {subtitle}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

// ── Plan Distribution Card ───────────────────────────────────────────────────
const PlanDistributionCard: React.FC<{
  data: MembershipDistributionData | null;
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');

  if (isLoading) {
    return <Skeleton height="100%" minH="220px" borderRadius="xl" />;
  }

  const slices: DistributionSlice[] = data?.slices ?? [];
  const total = data?.totalCount ?? 0;

  const chartData = {
    labels: slices.map(s => s.name),
    datasets: [
      {
        data: slices.map(s => s.count),
        backgroundColor: slices.map((_, i) => SLICE_COLORS[i % SLICE_COLORS.length]),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: '68%',
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(0) : 0;
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <Box
      bg={cardBg}
      border="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={4}
      boxShadow="sm"
      h="100%"
    >
      <Text fontSize="sm" fontWeight="bold" color={textColor} mb={1}>
        Plan distribution
      </Text>
      <Text fontSize="xs" color={subtitleColor} mb={3}>
        By active members
      </Text>

      {slices.length === 0 ? (
        <Flex h="140px" align="center" justify="center">
          <Text fontSize="xs" color={subtitleColor}>No data available</Text>
        </Flex>
      ) : (
        <>
          {/* Donut chart with center label */}
          <Box position="relative" h="148px" mb={3}>
            <Box position="relative" zIndex={2} h="100%">
              <Doughnut data={chartData} options={chartOptions} />
            </Box>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              textAlign="center"
              pointerEvents="none"
              zIndex={1}
            >
              <Text fontSize="4xl" fontWeight="extrabold" color={textColor} lineHeight="1.1">
                {total.toLocaleString()}
              </Text>
              <Text fontSize="9px" color={subtitleColor} fontWeight="medium">
                total
              </Text>
            </Box>
          </Box>

          {/* Legend */}
          <Flex direction="column" gap={1.5}>
            {slices.map((slice, i) => {
              const pct = total > 0 ? ((slice.count / total) * 100).toFixed(0) : '0';
              return (
                <Flex key={i} align="center" justify="space-between">
                  <Flex align="center" gap={1.5} minW={0}>
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={SLICE_COLORS[i % SLICE_COLORS.length]}
                      flexShrink={0}
                    />
                    <Text fontSize="xs" color={textColor} noOfLines={1}>
                      {slice.name}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" color={subtitleColor} fontWeight="medium" flexShrink={0} ml={2}>
                    {slice.count } ({pct}%)
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        </>
      )}
    </Box>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const MembershipAnalytics: React.FC = () => {
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const [isLoading, setIsLoading] = useState(true);
  const [activeMembers, setActiveMembers] = useState<number | null>(null);
  const [currentRevenue, setCurrentRevenue] = useState<number | null>(null);
  const [lastRevenue, setLastRevenue] = useState<number | null>(null);
  const [distribution, setDistribution] = useState<MembershipDistributionData | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const [members, current, last, dist] = await Promise.all([
        membershipAnalyticsService.getActiveMembersCount(),
        membershipAnalyticsService.getCurrentMonthRevenue(),
        membershipAnalyticsService.getLastMonthRevenue(),
        membershipAnalyticsService.getMembershipDistribution(),
      ]);
      setActiveMembers(members);
      setCurrentRevenue(current?.totalRevenue ?? null);
      setLastRevenue(last?.totalRevenue ?? null);
      setDistribution(dist);
      setIsLoading(false);
    };
    fetchAll();
  }, []);

  const revenueTrend =
    currentRevenue !== null && lastRevenue !== null
      ? computeTrend(currentRevenue, lastRevenue)
      : null;

  const cards: CardDef[] = [
    {
      value: isLoading ? '—' : (activeMembers ?? 0).toLocaleString(),
      subtitle: 'Active members',
      iconSrc: memberIcon,
      iconNeedsWrapper: true,
      trend: null,
    },
    {
      value: isLoading ? '—' : formatCurrency(currentRevenue ?? 0),
      subtitle: 'Current Month Revenue',
      iconSrc: dollarIcon,
      iconNeedsWrapper: false,
      trend: null,
    },
    {
      value: isLoading ? '—' : formatCurrency(lastRevenue ?? 0),
      subtitle: 'Last Month Revenue',
      iconSrc: revenueIcon,
      iconNeedsWrapper: false,
      trend: null,
    },
  ];

  return (
    <Box>
      <Heading size="md" color={textColor} mb={3}>
        Membership Analytics
      </Heading>

      <Flex gap={4} align="stretch" flexDir={{ base: 'column', lg: 'row' }}>
        {/* Left: 3 stat cards */}
        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          spacing={3}
          flex="1"
          minW={0}
          h="100%"
        >
          {isLoading
            ? [0, 1, 2].map(i => <Skeleton key={i} minH="180px" borderRadius="xl" />)
            : cards.map((card, i) => <AnalyticsStatCard key={i} {...card} />)}
        </SimpleGrid>

        {/* Right: Plan Distribution */}
        <Box w={{ base: '100%', md: '240px', lg: '260px' }} minW={{ md: '240px', lg: '260px' }} flexShrink={0}>
          <PlanDistributionCard data={distribution} isLoading={isLoading} />
        </Box>
      </Flex>
    </Box>
  );
};

export default MembershipAnalytics;
