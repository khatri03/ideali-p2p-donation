import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { MdAdd, MdFilterList, MdSearch } from 'react-icons/md';
import Card from 'themeComponents/card/Card';
import Loader from '../../common/Loader';
import { isRealAdmin } from '../../../service/organizer/rolesPermissions/permissionsService';
import CommonMethod from 'app/service/helpers/commonMethod';
import notificationService, { NotificationListItem } from '../../../service/admin/notificationService';
import NotificationDataTable from './notificationDataTable';
import ConfirmationModal from '../../common/ConfirmationModal';

// ─── Stat Card ────────────────────────────────────────────────────────────────

type StatCardProps = {
  icon: React.ReactElement;
  value: number;
  label: string;
  iconBg: string;
};

function StatCard({ icon, value, label, iconBg }: StatCardProps) {
  return (
    <Card flex={1}>
      <HStack spacing={4} p={1}>
        <Flex
          w="48px"
          h="48px"
          borderRadius="lg"
          bg={iconBg}
          align="center"
          justify="center"
          flexShrink={0}
        >
          {icon}
        </Flex>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" lineHeight="1">
            {value}
          </Text>
          <Text fontSize="sm" color="gray.500" mt={0.5}>
            {label}
          </Text>
        </Box>
      </HStack>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationCenter() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (!isRealAdmin()) {
      navigate('/auth/sign-in/custom');
      return;
    }
    fetchNotifications();
  }, [navigate, pageIndex]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(pageIndex + 1, pageSize);
      setNotifications(response.pageData || []);
      setTotalRows(response.totalRecordsCount || 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalSent = notifications.filter((n) => n.status === 'Sent').length;
  const totalFailed = notifications.filter((n) => n.status === 'Failed').length;
  const totalRecipients = notifications.reduce((sum, n) => sum + (n.recipientCount || 0), 0);

  // ── Filtered/sorted view ──────────────────────────────────────────────────
  const filtered = notifications
    .filter((n) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        n.subject?.toLowerCase().includes(term) ||
        n.createdBy?.toLowerCase().includes(term);
      const matchesStatus = !statusFilter || n.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aTime = new Date(a.sentAt).getTime();
      const bTime = new Date(b.sentAt).getTime();
      return sortOrder === 'Newest' ? bTime - aTime : aTime - bTime;
    });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleView(id: number) {
    navigate(`/admin/notification-center/view/${id}`);
  }

  function handleEdit(id: number) {
    navigate(`/admin/notification-center/edit/${id}`);
  }

  async function handleResend(id: number) {
    try {
      await notificationService.resendNotification(id);
      toast({ title: 'Notification resent', status: 'success', position: 'top-right' });
      fetchNotifications();
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    }
  }

  async function handleDeleteConfirm() {
    if (deleteTargetId === null) return;
    try {
      setIsDeleting(true);
      await notificationService.archiveNotification(deleteTargetId);
      toast({ title: 'Notification deleted', status: 'success', position: 'top-right' });
      setDeleteTargetId(null);
      fetchNotifications();
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

  if (loading && notifications.length === 0) {
    return (
      <Flex direction="column" pt={{ sm: '125px', lg: '75px' }} align="center" justify="center" minH="400px">
        <Loader message="Loading Notifications..." subtitle="Please wait while we fetch notifications" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" pt={{ sm: '125px', lg: '75px' }} gap={4}>

      {/* ── Header ── */}
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="2xl" fontWeight="bold">
            Notification Center
          </Text>
          <Text fontSize="sm" color="gray.500" mt={0.5}>
            Create and manage notifications sent to organizers
          </Text>
        </Box>
        <Button
          leftIcon={<MdAdd />}
          onClick={() => navigate('/admin/notification-center/create')}
          bg="#044bd9"
          color="white"
          _hover={{ bg: '#033fb6' }}
        >
          New Notification
        </Button>
      </Flex>

      {/* ── Stats ── */}
      <HStack spacing={4} align="stretch">
        <StatCard
          icon={<Icon viewBox="0 0 24 24" w={6} h={6} color="blue.500"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></Icon>}
          value={totalSent}
          label="Total Sent"
          iconBg="blue.50"
        />
        <StatCard
          icon={<Icon viewBox="0 0 24 24" w={6} h={6} color="green.500"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></Icon>}
          value={totalRecipients}
          label="Total Recipients"
          iconBg="green.50"
        />
        <StatCard
          icon={<Icon viewBox="0 0 24 24" w={6} h={6} color="red.500"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></Icon>}
          value={totalFailed}
          label="Failed"
          iconBg="red.50"
        />
      </HStack>

      {/* ── Table card ── */}
      <Card px="0px">
        {/* Controls */}
        <Flex justify="space-between" align="center" px={6} py={4} gap={3} wrap="wrap">
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none" h="full" display="flex" alignItems="center">
              <MdSearch color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search by subject"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              borderRadius="md"
            />
          </InputGroup>

          <HStack spacing={2}>
            <Menu>
              <MenuButton
                as={Button}
                leftIcon={<MdFilterList />}
                size="sm"
                variant="outline"
              >
                Filter
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => setStatusFilter('')}>All</MenuItem>
                <MenuItem onClick={() => setStatusFilter('Sent')}>Sent</MenuItem>
                <MenuItem onClick={() => setStatusFilter('Failed')}>Failed</MenuItem>
                <MenuItem onClick={() => setStatusFilter('Pending')}>Pending</MenuItem>
              </MenuList>
            </Menu>

            <Select
              size="sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'Newest' | 'Oldest')}
              borderRadius="md"
              w="120px"
            >
              <option value="Oldest">Oldest</option>
              <option value="Newest">Newest</option>
            </Select>
          </HStack>
        </Flex>

        <NotificationDataTable
          data={filtered}
          totalRows={totalRows}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          onPaginationChange={({ pageIndex: pi }) => {
            if (typeof pi === 'number') setPageIndex(pi);
          }}
          onView={handleView}
          onEdit={handleEdit}
          onResend={handleResend}
          onDelete={(id) => setDeleteTargetId(id)}
        />
      </Card>

      {/* ── Delete confirmation ── */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </Flex>
  );
}
