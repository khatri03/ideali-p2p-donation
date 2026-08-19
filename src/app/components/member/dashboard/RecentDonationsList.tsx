import { Avatar, Box, Divider, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { RecentDonationItem } from 'app/interface/memberInter/donorDashboardDto';
import Loader from 'app/components/common/Loader';
import { useNavigate } from 'react-router-dom';

interface RecentDonationsListProps {
  donations: RecentDonationItem[];
  loading?: boolean;
}

function formatDate(utc: string): string {
  // API returns a UTC timestamp without a trailing 'Z', so Date would otherwise
  // parse it as local time and skip the timezone conversion entirely.
  const isoUtc = /[zZ]|[+-]\d{2}:?\d{2}$/.test(utc) ? utc : `${utc}Z`;
  return new Date(isoUtc).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function RecentDonationsList({ donations, loading }: RecentDonationsListProps) {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      p="20px"
      flex="1"
      boxShadow="sm"
      border="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Flex justify="space-between" align="center" mb="4px">
        <Box>
          <Text color={textColor} fontWeight="700" fontSize="lg">Recent Donations</Text>
          <Text color={subColor} fontSize="xs">Your latest contributions</Text>
        </Box>
        <Text
          color="brand.500"
          fontSize="sm"
          fontWeight="600"
          cursor="pointer"
          _hover={{ textDecoration: 'underline' }}
          onClick={() => navigate('/member/my-donations')}
        >
          View all
        </Text>
      </Flex>
      <Divider borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')} my="12px" />

      {loading ? (
        <Loader message="Loading donations…" subtitle="Please wait while we fetch your recent donations" />
      ) : donations.length === 0 ? (
        <Text color={subColor} textAlign="center" py="40px" fontSize="sm">No donations yet.</Text>
      ) : (
        donations.map((d) => (
          <Box key={d.invoiceUniqueId}>
            <Flex align="center" py="12px" gap="12px">
              <Avatar name={d.campaignName} size="sm" borderRadius="8px" bg="brand.500" color="white" />
              <Box flex="1">
                <Text color={textColor} fontWeight="600" fontSize="sm">{d.campaignName}</Text>
                <Text color={subColor} fontSize="xs">
                  {d.organizerName} · {formatDate(d.donationDateUtc)}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text color="green.500" fontWeight="700" fontSize="sm">
                  ${d.donationAmount.toLocaleString()}
                </Text>
                {d.tipAmount > 0 && (
                  <Text color={subColor} fontSize="xs">+${d.tipAmount} tip</Text>
                )}
              </Box>
            </Flex>
            <Divider borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')} />
          </Box>
        ))
      )}
    </Box>
  );
}

export default RecentDonationsList;
