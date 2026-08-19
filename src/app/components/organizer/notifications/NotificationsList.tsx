import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Badge,
  IconButton,
  Button,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { MdDelete, MdVisibility } from 'react-icons/md';
import Loader from '../../common/Loader';
import { DynamicTable, Column } from '../donation/organizerDonationComponents/DynamicTable';
import Pagination from '../donation/organizerDonationComponents/Pagination';
import ConfirmationModal from '../../common/ConfirmationModal';
import CommonMethod from 'app/service/helpers/commonMethod';
import organizerNotificationService, {
  OrganizerNotificationItem,
  OrganizerNotificationSummary,
} from '../../../service/organizer/notifications/organizerNotificationService';

type Tab = 'all' | 'unread' | 'read';

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    );
  } catch {
    return dateStr;
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box flex={1} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
      <Text fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" mb={1}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={color}>
        {value}
      </Text>
    </Box>
  );
}

export default function NotificationsList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [summary, setSummary] = useState<OrganizerNotificationSummary>({ total: 0, read: 0, unread: 0 });
  const [items, setItems] = useState<OrganizerNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [currentPage]);

  useEffect(() => {
    function handleNewNotifications() {
      // Background refresh: no loading spinner, smart merge to prevent flicker.
      loadNotifications(true);
      loadSummary();
    }
    window.addEventListener('new-notifications', handleNewNotifications);
    return () => window.removeEventListener('new-notifications', handleNewNotifications);
  }, []);

  async function loadSummary() {
    try {
      const data = await organizerNotificationService.getSummary();
      // Skip re-render if nothing changed.
      setSummary(prev =>
        prev.total === data.total && prev.read === data.read && prev.unread === data.unread
          ? prev
          : data
      );
    } catch {
      // non-critical
    }
  }

  async function loadNotifications(background = false) {
    try {
      if (!background) setLoading(true);
      const data = await organizerNotificationService.getNotifications(currentPage, pageSize);
      // Smart merge: skip re-render if the list content hasn't changed.
      setItems(prev => {
        const unchanged =
          prev.length === data.pageData.length &&
          prev.every((p, i) => {
            const n = data.pageData[i];
            return n && p.recipientId === n.recipientId && p.isRead === n.isRead && p.subject === n.subject;
          });
        return unchanged ? prev : data.pageData;
      });
      setTotalRecords(prev => prev === data.totalRecordsCount ? prev : data.totalRecordsCount);
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

  async function handleDelete() {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await organizerNotificationService.deleteNotification(deleteId);
      toast({ title: 'Notification deleted', status: 'success', position: 'top-right' });
      setDeleteId(null);
      loadNotifications();
      loadSummary();
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.createdBy.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unread' && !item.isRead) ||
      (activeTab === 'read' && item.isRead);
    return matchesSearch && matchesTab;
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: summary.total },
    { key: 'unread', label: 'Unread', count: summary.unread },
    { key: 'read', label: 'Read', count: summary.read },
  ];

  const columns: Column<OrganizerNotificationItem>[] = [
    {
      key: 'subject',
      header: 'Subject',
      render: (_, row) => (
        <HStack spacing={2}>
          {!row.isRead && (
            <Box w="8px" h="8px" borderRadius="full" bg="#2563EB" flexShrink={0} />
          )}
          <Text fontSize="sm" fontWeight={row.isRead ? 'normal' : '600'} color="gray.800">
            {row.subject}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'createdBy',
      header: 'From',
      width: '200px',
      render: (_, row) => (
        <HStack spacing={2}>
          <Flex
            w="28px"
            h="28px"
            borderRadius="full"
            bg="#2563EB"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Text fontSize="xs" fontWeight="bold" color="white">
              {row.createdBy?.charAt(0).toUpperCase() || 'S'}
            </Text>
          </Flex>
          <Text fontSize="sm" color="gray.700">
            {row.createdBy || 'System Admin'}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'sentAt',
      header: 'Date & Time',
      width: '180px',
      render: (_, row) => (
        <Text fontSize="sm" color="gray.600">
          {formatDateTime(row.sentAt)}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (_, row) => (
        <HStack spacing={1} justify="flex-end">
          <IconButton
            aria-label="View notification"
            icon={<MdVisibility />}
            size="sm"
            colorScheme="blue"
            variant="ghost"
            onClick={() => navigate(`/organizer/notifications/view/${row.recipientId}`)}
          />
          <IconButton
            aria-label="Delete notification"
            icon={<MdDelete />}
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={() => setDeleteId(row.recipientId)}
          />
        </HStack>
      ),
    },
  ];

  return (
    <Flex direction="column" pt={{ sm: '125px', lg: '75px' }} gap={4}>

      {/* Stats */}
      <HStack spacing={4} align="stretch">
        <StatCard label="Total" value={summary.total} color="#2563EB" />
        <StatCard label="Unread" value={summary.unread} color="#E05353" />
        <StatCard label="Read" value={summary.read} color="#2DB88A" />
      </HStack>

      {/* Search + Tabs */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <InputGroup maxW="320px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fontSize="sm"
            bg="white"
          />
        </InputGroup>

        <HStack spacing={1}>
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              bg={activeTab === tab.key ? '#2563EB' : 'white'}
              color={activeTab === tab.key ? 'white' : 'gray.600'}
              _hover={{ bg: activeTab === tab.key ? '#1d4ed8' : 'gray.100' }}
              borderRadius="full"
              px={4}
              borderWidth="1px"
              borderColor={activeTab === tab.key ? '#2563EB' : 'gray.200'}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  ml={2}
                  bg={activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'blue.50'}
                  color={activeTab === tab.key ? 'white' : 'blue.600'}
                  borderRadius="full"
                  fontSize="xs"
                >
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* Table */}
      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Loader message="Loading notifications..." subtitle="Please wait" />
        </Flex>
      ) : (
        <>
          <DynamicTable
            data={filtered}
            columns={columns}
            emptyMessage="No notifications found."
          />

          {filtered.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              entriesPerPage={pageSize}
              onPageChange={setCurrentPage}
              displayedItemsCount={filtered.length}
            />
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </Flex>
  );
}
