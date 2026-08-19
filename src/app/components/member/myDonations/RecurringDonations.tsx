import {
  Avatar, Badge, Box, Button, Divider, Flex, Text, useColorModeValue, useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { RecurringDonationRecord } from 'app/interface/memberInter/donorDonationDto';
import Loader from 'app/components/common/Loader';
import donorDonationService from '../services/donorDonationService';

const STATUS_COLORS: Record<string, string> = {
  Active: 'green', Paused: 'yellow', Cancelled: 'red',
};

function RecurringDonations() {
  const [records, setRecords] = useState<RecurringDonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'navy.800');
  const textColor = useColorModeValue('#1B2559', 'white');
  const subColor = useColorModeValue('#A3AED0', '#A3AED0');
  const dividerColor = useColorModeValue('gray.100', 'whiteAlpha.100');

  useEffect(() => {
    donorDonationService.getRecurringDonations().then((res) => {
      setRecords(res);
      setLoading(false);
    });
  }, []);

  const handleCancel = async (subscriptionId: string) => {
    setCancelling(subscriptionId);
    const ok = await donorDonationService.cancelRecurringDonation(subscriptionId);
    if (ok) {
      setRecords((prev) => prev.map((r) => r.subscriptionId === subscriptionId ? { ...r, status: 'Cancelled' as const } : r));
      toast({ title: 'Recurring donation cancelled.', status: 'success', duration: 3000 });
    } else {
      toast({ title: 'Failed to cancel. Please try again.', status: 'error', duration: 3000 });
    }
    setCancelling(null);
  };

  return (
    <Box bg={cardBg} borderRadius="20px" p="20px">
      <Text color={textColor} fontWeight="700" fontSize="lg" mb="4px">Recurring Donations</Text>
      <Text color={subColor} fontSize="xs" mb="16px">Your active scheduled contributions</Text>
      {loading ? (
        <Loader message="Loading recurring donations…" subtitle="Please wait while we fetch your scheduled contributions" />
      ) : records.length === 0 ? (
        <Text color={subColor} textAlign="center" py="24px" fontSize="sm">No recurring donations set up.</Text>
      ) : (
        records.map((r, i) => (
          <Box key={r.subscriptionId}>
            <Flex align="center" gap="12px" py="14px">
              <Avatar src={r.campaignImageUrl ?? undefined} name={r.campaignName} size="sm" borderRadius="8px" />
              <Box flex="1">
                <Text color={textColor} fontWeight="600" fontSize="sm">{r.campaignName}</Text>
                <Text color={subColor} fontSize="xs">{r.organizerName} · Next: {new Date(r.nextPaymentDateUtc).toLocaleDateString()}</Text>
              </Box>
              <Flex align="center" gap="10px">
                <Box textAlign="right">
                  <Text color="green.500" fontWeight="700" fontSize="sm">${r.amount.toLocaleString()}</Text>
                  <Text color={subColor} fontSize="xs">{r.frequency}</Text>
                </Box>
                <Badge colorScheme={STATUS_COLORS[r.status] ?? 'gray'} borderRadius="6px" px="6px">{r.status}</Badge>
                {r.status === 'Active' && (
                  <Button size="xs" variant="outline" colorScheme="red" isLoading={cancelling === r.subscriptionId} onClick={() => handleCancel(r.subscriptionId)}>
                    Cancel
                  </Button>
                )}
              </Flex>
            </Flex>
            {i < records.length - 1 && <Divider borderColor={dividerColor} />}
          </Box>
        ))
      )}
    </Box>
  );
}

export default RecurringDonations;
