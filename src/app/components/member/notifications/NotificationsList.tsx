import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  HStack,
  Select,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { MdCheck } from 'react-icons/md';
import Loader from '../../common/Loader';
import Pagination from '../../organizer/donation/organizerDonationComponents/Pagination';
import StatusBadge from '../../common/StatusBadge';
import CommonMethod from 'app/service/helpers/commonMethod';
import memberNotificationService, {
  MemberNotificationItem,
  MemberNotificationSummary,
} from '../services/memberNotificationService';

type Filter = 'all' | 'unread' | 'read';

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' ' +
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string): string {
  return (
    html
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || ''
  );
}

export default function NotificationsList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [summary, setSummary] = useState<MemberNotificationSummary>({
    total: 0,
    read: 0,
    unread: 0,
  });
  const [items, setItems] = useState<MemberNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [currentPage, filter]);

  async function loadSummary() {
    try {
      const data = await memberNotificationService.getSummary();
      setSummary((prev) =>
        prev.total === data.total &&
        prev.read === data.read &&
        prev.unread === data.unread
          ? prev
          : data,
      );
    } catch {
      // non-critical
    }
  }

  async function loadNotifications(background = false) {
    try {
      if (!background) setLoading(true);
      const data = await memberNotificationService.getAlerts(
        currentPage,
        pageSize,
        filter === 'unread',
      );
      setItems(data.pageData);
      setTotalRecords(data.totalRecordsCount);
    } catch (error) {
      if (!background) {
        toast({
          title: 'Error loading notifications',
          description: CommonMethod.ErrorMessage(error),
          status: 'error',
          position: 'top-right',
        });
      }
    } finally {
      if (!background) setLoading(false);
    }
  }

  const visibleItems =
    filter === 'read' ? items.filter((i) => i.isRead) : items;

  function handleOpenItem(item: MemberNotificationItem) {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((n) =>
          n.uniqueId === item.uniqueId ? { ...n, isRead: true } : n,
        ),
      );
      setSummary((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1,
      }));
      memberNotificationService.markAsRead(item.uniqueId).catch(() => {
        setItems((prev) =>
          prev.map((n) =>
            n.uniqueId === item.uniqueId ? { ...n, isRead: false } : n,
          ),
        );
        setSummary((prev) => ({
          ...prev,
          unread: prev.unread + 1,
          read: Math.max(0, prev.read - 1),
        }));
      });
    }
    navigate(`/member/notifications/view/${item.uniqueId}`);
  }

  return (
    <Flex direction="column" gap={4} pt={16}>
      {/* Header */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
        <Box>
          {/* <Text fontSize="xl" fontWeight="700" color="gray.900">
            Notifications
          </Text> */}
          <Text fontSize="sm" color="gray.500">
            Charity organizer alerts and system notifications.
          </Text>
        </Box>
        <Select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as Filter);
            setCurrentPage(1);
          }}
          size="sm"
          w="120px"
          bg="white"
          borderRadius="lg"
          fontSize="sm"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </Select>
      </Flex>

      {/* Feed */}
      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Loader message="Loading notifications..." subtitle="Please wait" />
        </Flex>
      ) : visibleItems.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={16}
          bg="white"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.100"
        >
          <Text fontSize="sm" color="gray.400" fontWeight="500">
            No notifications found.
          </Text>
        </Flex>
      ) : (
        <Flex
          direction="column"
          gap={3}
          bg="gray.50"
          border="1px solid"
          borderColor="gray.100"
          borderRadius="xl"
          p={4}
        >
          {visibleItems.map((item) => (
            <Box
              key={item.uniqueId}
              bg="white"
              borderRadius="lg"
              border="1px solid"
              borderColor={!item.isRead ? '#2563EB' : 'gray.200'}
              boxShadow={!item.isRead ? '0 0 0 1px #2563EB' : 'none'}
              px={4}
              py={3}
              cursor="pointer"
              _hover={{ borderColor: !item.isRead ? '#2563EB' : 'gray.300' }}
              onClick={() => handleOpenItem(item)}
            >
              <Flex justify="space-between" align="flex-start" gap={3}>
                <Box flex={1} minW={0}>
                  <HStack spacing={2} mb={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="700"
                      color="gray.900"
                      noOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <StatusBadge label={item.priority} variant="status" />
                  </HStack>
                  <Text fontSize="sm" color="gray.600" noOfLines={2} mb={2}>
                    {stripHtml(item.body)}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    From {item.sentBy || 'System'}
                  </Text>
                </Box>

                <Flex
                  direction="column"
                  align="flex-end"
                  gap={2}
                  flexShrink={0}
                >
                  <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
                    {formatDateTime(item.sentAtUtc)}
                  </Text>
                  {item.isRead ? (
                    <HStack spacing={1} color="green.500">
                      <Icon as={MdCheck} boxSize={3.5} />
                      <Text fontSize="xs" fontWeight="600">
                        Read
                      </Text>
                    </HStack>
                  ) : (
                    <Text fontSize="xs" fontWeight="600" color="#2563EB">
                      Unread
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Box>
          ))}
        </Flex>
      )}

      {!loading && visibleItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalRecords={totalRecords}
          entriesPerPage={pageSize}
          onPageChange={setCurrentPage}
          displayedItemsCount={visibleItems.length}
        />
      )}
    </Flex>
  );
}
