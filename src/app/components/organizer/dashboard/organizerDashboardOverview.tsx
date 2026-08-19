import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, useColorModeValue, Card, CardBody, CardHeader, SimpleGrid, Badge, Flex, Avatar, Icon, HStack, Wrap, WrapItem, GridItem, VStack, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Button, IconButton } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { MdPerson, MdEmail, MdBusiness, MdVerifiedUser, MdTrendingUp, MdGroup, MdAttachMoney, MdCardMembership, MdSwapHoriz, MdAutorenew, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import HttpClient from 'app/service/httpClient/HttpClient';
import donationService from 'app/service/organizer/donation/donationService';
import Loader from '../../common/Loader';
import { Link } from 'react-router-dom';
import PaymentAccountBanner from '../dashboard/paymentAccountbanner';
import PaymentAccountService from '../../../service/organizer/donation/paymentAccountService';
import RecentCampaigns from './recentCampaigns';
import GettingStartedGuide from './gettingStartedGuide';
import progressStatsService from '../../../service/organizer/dashboard/progressStats';
import MembershipAnalytics from './membershipAnalytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

interface UserInfo {
  userName: string;
  userEmail: string;
  userOrg: string;
  roles: string[];
  allowedModules: string[];
}

interface DecodedToken {
  userName?: string;
  userEmail?: string;
  userOrg?: string;
  allowedModules?: string | string[];
  [key: string]: any;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  gradient: string;
  subtitle?: string;
}

interface ListItemProps {
  primary: string;
  secondary: string;
  badge: { label: string; colorScheme: string };
  itemBg: string;
  hoverBg: string;
  textColor: string;
  secondaryColor: string;
}

interface RecentDonation {
  donor: string;
  campaign_name: string;
  amount: string;
  date: string;
  invoiceNo: string;
  invoiceStatus: string;
  currency: string;
  uniqueId?: string;
}

interface RecentDonationsTableProps {
  data: RecentDonation[];
}

// Format date as 12-Dec-2025
const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

interface DashboardSummary {
  totalDonations: number;
  recurringDonations: number;
  activeFundraisingCampaigns: number;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient, subtitle }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const titleColor = useColorModeValue('#4A5568', '#A0AEC0');

  const getIconColors = () => {
    if (gradient.includes('09ff00ff')) return { color: '#10b981', bg: '#d1fae5' };
    else if (gradient.includes('ed8936')) return { color: '#4299e1', bg: '#dbeafe' };
    else return { color: '#f6ad55', bg: '#fed7aa' };
  };
  const iconColors = getIconColors();

  return (
    <Box
      bg={cardBg}
      p={6}
      borderRadius="2xl"
      boxShadow="sm"
      border="1px"
      borderColor={borderColor}
      position="relative"
      transition="all 0.3s"
      _hover={{ boxShadow: 'md' }}
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={3} align="center">
          <Box bg={iconColors.bg} p={3} borderRadius="lg">
            <Icon as={icon} color={iconColors.color} boxSize={8} />
          </Box>
          <Text fontSize="md" fontWeight="bold" color={titleColor}>{title}</Text>
        </HStack>
        <Badge fontSize="xl" fontWeight="bold" px={3} py={1} borderRadius="md" bg="white">
          {value}
        </Badge>
      </Flex>
    </Box>
  );
};

// ─── List Item ────────────────────────────────────────────────────────────────
const ListItem: React.FC<ListItemProps> = ({ primary, secondary, badge, itemBg, hoverBg, textColor, secondaryColor }) => (
  <Flex
    align="center"
    justify="space-between"
    p={4}
    mb={2}
    bg={itemBg}
    borderRadius="lg"
    transition="all 0.2s"
    _hover={{ bg: hoverBg, transform: 'translateX(4px)' }}
  >
    <Box>
      <Text fontSize="sm" fontWeight="bold" color={textColor}>{primary}</Text>
      <Text fontSize="xs" color={'gray.800'}>{secondary}</Text>
    </Box>
    <Box textAlign="right">
      {badge.label.includes('$') ? (
        <Badge colorScheme={badge.colorScheme} fontSize="sm" px={3} py={1} borderRadius="md">{badge.label}</Badge>
      ) : (
        <>
          <Text fontSize="xs" color={'gray.800'} mb={1}>{secondary}</Text>
          <Badge colorScheme={badge.colorScheme} fontSize="sm" px={3} py={1} borderRadius="md">{badge.label}</Badge>
        </>
      )}
    </Box>
  </Flex>
);

// ─── Recent Donations Table ───────────────────────────────────────────────────
const RecentDonationsTable: React.FC<RecentDonationsTableProps> = ({ data }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const navigate = useNavigate();

  const handleInvoiceClick = (uniqueId: string) => {
    if (uniqueId) navigate(`/organizer/donation/invoice-detail/${uniqueId}`);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const rowEvenBg = useColorModeValue('gray.50', 'gray.700');
  const rowOddBg = useColorModeValue('white.100', 'white.600');

  return (
    <Card bg={cardBg} boxShadow="xl" borderRadius="2xl" border="1px" borderColor={borderColor} py={4}>
      <CardHeader pb={4}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color={textColor}>Recent Donations</Heading>
          <HStack spacing={3}>
            {!isCollapsed && (
              <Text fontSize="sm" color={'gray.800'}>
                Showing {data.length === 0 ? 0 : startIndex + 1}-{data.length === 0 ? 0 : Math.min(endIndex, data.length)} of {data.length}
              </Text>
            )}
            <IconButton
              aria-label="Toggle collapse"
              icon={<Icon as={isCollapsed ? MdChevronRight : MdChevronLeft} />}
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              colorScheme="purple"
            />
          </HStack>
        </Flex>
        <Box w="100%" h="1px" bg={borderColor} />
      </CardHeader>
      {!isCollapsed && (
        <CardBody p={0}>
          <TableContainer>
            <Table variant="simple">
              <Thead bg="gray.200" _dark={{ bg: 'gray.700' }}>
                <Tr>
                  <Th color={'gray.800'} fontWeight="bold" textTransform="uppercase" fontSize="xs">Receipt No</Th>
                  <Th color={'gray.800'} fontWeight="bold" textTransform="uppercase" fontSize="xs">Campaign Name</Th>
                  <Th color={'gray.800'} fontWeight="bold" textTransform="uppercase" fontSize="xs">Donor</Th>
                  <Th color={'gray.800'} fontWeight="bold" textTransform="uppercase" fontSize="xs">Amount</Th>
                  <Th color={'gray.800'} fontWeight="bold" textTransform="uppercase" fontSize="xs">Date</Th>
                  <Th color={'gray.800'} fontWeight="bold" textTransform="uppercase" fontSize="xs">Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, index) => (
                    <Tr key={index} bg={index % 2 === 0 ? rowOddBg : rowEvenBg}>
                      <Td borderBottomColor={borderColor}>
                        <Button variant="link" color="blue.600" size="sm" onClick={() => handleInvoiceClick(item.uniqueId || '')}>
                          {item.invoiceNo}
                        </Button>
                      </Td>
                      <Td borderBottomColor={borderColor}>
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>{item.campaign_name}</Text>
                      </Td>
                      <Td borderBottomColor={borderColor}>
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>{item.donor}</Text>
                      </Td>
                      <Td borderBottomColor={borderColor}>
                        <Badge fontSize="sm" px={3} py={1} borderRadius="md" bg="white">
                          {item.currency} {item.amount}
                        </Badge>
                      </Td>
                      <Td borderBottomColor={borderColor}>
                        <Text fontSize="sm" color={'gray.800'}>{formatDate(item.date)}</Text>
                      </Td>
                      <Td borderBottomColor={borderColor}>
                        <Badge colorScheme={item.invoiceStatus === 'Paid' ? 'green' : 'red'} borderRadius="md" px={3} py={1}>
                          {item.invoiceStatus}
                        </Badge>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={8}>
                      <Text color={'gray.800'}>No donations found</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
          {data.length > itemsPerPage && (
            <Flex justify="space-between" align="center" px={6} py={4} borderTop="1px" borderColor={borderColor}>
              <Text fontSize="sm" color={'gray.800'}>Page {currentPage} of {totalPages}</Text>
              <HStack spacing={2}>
                <IconButton
                  aria-label="Previous page"
                  icon={<Icon as={MdChevronLeft} />}
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  isDisabled={currentPage === 1}
                  variant="outline"
                  colorScheme="purple"
                />
                <IconButton
                  aria-label="Next page"
                  icon={<Icon as={MdChevronRight} />}
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  isDisabled={currentPage === totalPages}
                  variant="outline"
                  colorScheme="purple"
                />
              </HStack>
            </Flex>
          )}
        </CardBody>
      )}
    </Card>
  );
};

// ─── Dashboard Sidebar ────────────────────────────────────────────────────────
const DashboardSidebar: React.FC<{
  totalDonations: number;
  recentDonations: RecentDonation[];
}> = ({ totalDonations, recentDonations }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const navigate = useNavigate();

  // Avatar background colors cycling
  const avatarColors = [
    { bg: '#dbeafe', text: '#1d4ed8' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef9c3', text: '#854d0e' },
  ];

  // Latest 10 donations for activity
  const recentActivity = recentDonations.slice(0, 10);

  return (
    <VStack
      spacing={4}
      align="stretch"
      w={{ base: '100%', md: '240px', lg: '260px' }}
      minW={{ md: '240px', lg: '260px' }}
      flexShrink={0}
    >
      {/* ── Total Donations Blue Card ── */}
      <Box
        bgGradient="linear(135deg, #3b5bdb, #5c7cfa)"
        borderRadius="2xl"
        p={5}
        color="white"
        position="relative"
        overflow="hidden"
        cursor="pointer"
        onClick={() => navigate('/organizer/donation/list/paid')}
        transition="all 0.2s"
        _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
      >
        {/* Decorative circle */}
        <Box
          position="absolute"
          top="-20px"
          right="-20px"
          w="100px"
          h="100px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />
        <Box
          position="absolute"
          bottom="-30px"
          right="20px"
          w="70px"
          h="70px"
          borderRadius="full"
          bg="whiteAlpha.100"
        />

        <Text fontSize="10px" fontWeight="bold" opacity={0.8} textTransform="uppercase" letterSpacing="widest" mb={1}>
          Total Donations
        </Text>
        <Text fontSize="2xl" fontWeight="extrabold" lineHeight="1.2" mb={1}>
          ${totalDonations.toLocaleString()}
        </Text>
        <Text fontSize="11px" opacity={0.75} mb={4}>
          raised across all campaigns
        </Text>
        <HStack spacing={2} align="center">
          {/* <Badge
            bg="whiteAlpha.300"
            color="white"
            fontSize="11px"
            px={2}
            py={0.5}
            borderRadius="md"
            fontWeight="bold"
          >
            +18.2%
          </Badge> */}
          {/* <Text fontSize="11px" opacity={0.75}>vs. last month</Text> */}
        </HStack>
      </Box>

      {/* ── Recent Activity Card ── */}
      <Box
        bg={cardBg}
        border="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        p={4}
        boxShadow="sm"
      >
        <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>
          Recent Activity
        </Text>

        {recentActivity.length > 0 ? (
          <Box
            maxH="216px"
            overflowY="auto"
            pr={4}
            sx={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { background: 'transparent', marginLeft: '4px' },
              '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '8px', marginLeft: '4px' },
              '&::-webkit-scrollbar-thumb:hover': { background: '#A0AEC0' },
              scrollbarGutter: 'stable',
            }}
          >
          <VStack spacing={0} align="stretch">
            {recentActivity.map((item, idx) => {
              const colors = avatarColors[idx % avatarColors.length];
              return (
                <Flex
                  key={idx}
                  justify="space-between"
                  align="center"
                  py={2.5}
                  borderBottom={idx < recentActivity.length - 1 ? '1px' : 'none'}
                  borderColor={borderColor}
                  cursor={item.uniqueId ? 'pointer' : 'default'}
                  _hover={item.uniqueId ? { bg: 'gray.50' } : undefined}
                  borderRadius="md"
                  px={1}
                  onClick={() => item.uniqueId && navigate(`/organizer/donation/invoice-detail/${item.uniqueId}`)}
                >
                  <HStack spacing={2.5}>
                    {/* Avatar */}
                    <Box
                      w="34px"
                      h="34px"
                      borderRadius="full"
                      bg={colors.bg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="xs" fontWeight="bold" color={colors.text}>
                        {item.donor.charAt(0).toUpperCase()}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color={textColor} noOfLines={1} maxW="120px">
                        {item.donor}
                      </Text>
                      <Text fontSize="10px" color="gray.500">
                        {formatDate(item.date)}
                      </Text>
                    </Box>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">
                  ${(item.amount)}
                  </Text>
                </Flex>
              );
            })}
          </VStack>
          </Box>
        ) : (
          <Text fontSize="xs" color="gray.500" textAlign="center" py={6}>
            No recent activity
          </Text>
        )}
      </Box>
    </VStack>
  );
};


// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OrganizerDashboardOverview() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userName: '', userEmail: '', userOrg: '', roles: [], allowedModules: []
  });
  const [donationData, setDonationData] = useState<RecentDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const [isGuideDismissed, setIsGuideDismissed] = useState(
    () => localStorage.getItem('gettingStartedGuideDismissed') === 'true'
  );
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    transactionsAmount: 0,
    usersAsMembers: 0,
    totalTransactions: 0,
  });

  const handleSetupPaymentAccount = () => {
    navigate('/organizer/setting/payment-account');
  };

  const handleDismissGuide = () => {
    localStorage.setItem('gettingStartedGuideDismissed', 'true');
    setIsGuideDismissed(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      const authToken = localStorage.getItem('AuthToken');
      if (!authToken) {
        setError('Authentication token not found.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsCheckingPayment(true);
      setError(null);

      try {
        // Fetch all dashboard data in parallel
        const [progressStats, summary, recentDonationsResponse] = await Promise.all([
          progressStatsService.getProgressStats(),
          donationService.getDashboardSummary(),
          HttpClient.get(`/api/donation/campaign/dashboard-list?pageNo=1&pageSize=10`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          })
        ]);

        // Process Progress Stats (Guide and Payment Banner)
        if (progressStats) {
          const completed: number[] = [];
          if (progressStats.paymentAccountCreated) completed.push(1);
          if (progressStats.campaignCreated) completed.push(2);
          if (progressStats.campaignPublished) completed.push(3);
          setCompletedSteps(completed);
          
          // Use progress stats to show/hide payment banner instead of separate API call
          setShowPaymentBanner(!progressStats.paymentAccountCreated);
        }

        // Process Summary Stats
        if (summary) {
          setStats({
            totalUsers: summary.totalDonations ?? 0,
            transactionsAmount: summary.recurringDonations ?? 0,
            usersAsMembers: summary.activeFundraisingCampaigns ?? 0,
            totalTransactions: 0,
          });
        }

        // Process Recent Donations
        const result = recentDonationsResponse.data || recentDonationsResponse;
        const apiData = result.data?.pageData || [];
        const formattedData: RecentDonation[] = apiData.map((item: any) => ({
          donor: item.donorName?.trim() || 'Anonymous Donor',
          campaign_name: item.campaignName || 'N/A',
          amount: `${item.amount.toFixed(2)}`,
          date: new Date(item.invoiceDateUtc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          invoiceNo: item.invoiceNo || 'N/A',
          invoiceStatus: item.invoiceStatus || 'N/A',
          currency: item.currency || 'USD',
          uniqueId: item.uniqueId || '',
        }));
        setDonationData(formattedData);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'An error occurred while loading dashboard data.');
      } finally {
        setIsLoading(false);
        setIsCheckingPayment(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const session = localStorage.getItem('AuthToken');
    const role = localStorage.getItem('userRole');
    let currentRole = localStorage.getItem('currentRole');

    const roles = role?.split(',').map(r => r.trim().toLowerCase()) || [];
    if (roles.includes('organizer') && currentRole?.toLowerCase() !== 'organizer') {
      currentRole = 'organizer';
      localStorage.setItem('currentRole', currentRole);
    }
    if (currentRole?.toLowerCase() !== 'organizer') return navigate('/auth/sign-in/custom');

    try {
      const decoded = jwtDecode<DecodedToken>(session);
      const roleKey = Object.keys(decoded).find(key => key.toLowerCase().includes('role'));
      const userRoles = roleKey && decoded[roleKey]
        ? (Array.isArray(decoded[roleKey]) ? decoded[roleKey] : [decoded[roleKey]])
        : [];

      let allowedModules: string[] = [];
      if (decoded.allowedModules) {
        allowedModules = Array.isArray(decoded.allowedModules)
          ? decoded.allowedModules
          : typeof decoded.allowedModules === 'string' && decoded.allowedModules.includes(',')
            ? decoded.allowedModules.split(',').map(m => m.trim())
            : [decoded.allowedModules];
      }

      setUserInfo({
        userName: decoded.userName || '',
        userEmail: decoded.userEmail || '',
        userOrg: decoded.userOrg || '',
        roles: userRoles,
        allowedModules
      });
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, [navigate]);

  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBorderColor = useColorModeValue('gray.200', 'gray.700');

  const statCards = [
    {
      title: 'Total Donations',
      value: `$${stats.totalUsers.toLocaleString()}`,
      icon: MdAttachMoney,
      gradient: 'linear(to-b, #09ff00ff, #0fcb09ff)',
      link: '/organizer/donation/list/paid',
    },
    {
      title: 'Recurring Donors',
      value: stats.transactionsAmount.toLocaleString(),
      icon: MdAutorenew,
      gradient: 'linear(to-b, #ed8936, #dd6b20)',
      link: '/organizer/donation/recurring-donations',
    },
    {
      title: 'Fundraising Campaigns',
      value: stats.usersAsMembers.toLocaleString(),
      icon: MdCardMembership,
      gradient: 'linear(to-b, #48bb78, #38a169)',
      link: '/organizer/donation/manage-donation-module',
    }
  ];

  return (
    <Box mt={20} minH="100vh">

      {/* ── Header ── */}
      {/* <Flex
        justify="space-between"
        align="center"
        mb={4}
        mt={8}
        gap={4}
        flexWrap={{ base: 'wrap', lg: 'nowrap' }}
      >
        <Box flex="1" minW={{ base: '100%', lg: 'auto' }}>
          <Heading
            color={textColor}
            fontSize="2xl"
            fontWeight="bold"
            bgGradient="linear(to-r, #667eea, #764ba2)"
            bgClip="text"
          >
            Welcome, {userInfo.userName}!
          </Heading>
          
        </Box>
        {!isCheckingPayment && (
          <Box minW={{ base: '100%', lg: 'auto' }} maxW={{ base: '100%', lg: '500px' }}>
            <PaymentAccountBanner
              showBanner={showPaymentBanner}
              onSetupClick={handleSetupPaymentAccount}
            />
          </Box>
        )}
      </Flex> */}

      {/* ── Getting Started Guide ── */}
      {!isGuideDismissed && !isCheckingPayment && (
        <GettingStartedGuide
          completedSteps={completedSteps}
          onDismiss={handleDismissGuide}
        />
      )}

      {/* ── Campaigns Grid + Sidebar ── */}
      <Card bg={cardBg} border="1px" borderColor={sectionBorderColor} borderRadius="2xl" boxShadow="sm" mb={5}>
        <CardBody p={4}>
          <Flex
            gap={5}
            align="flex-start"
            flexDir={{ base: 'column', md: 'row' }}
          >
            {/* Left: Recent Campaigns */}
            <Box flex="1" minW={0}>
              <RecentCampaigns />
            </Box>

            {/* Right: Sidebar */}
            <DashboardSidebar
              totalDonations={stats.totalUsers}
              recentDonations={donationData}
            />
          </Flex>
        </CardBody>
      </Card>

      {/* ── Membership Analytics ── */}
      <Card bg={cardBg} border="1px" borderColor={sectionBorderColor} borderRadius="2xl" boxShadow="sm" mb={5}>
        <CardBody p={5}>
          <MembershipAnalytics />
        </CardBody>
      </Card>

    </Box>
  );
}