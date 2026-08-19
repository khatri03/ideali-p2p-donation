import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  HStack,
  IconButton,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { MdArrowBack, MdDelete } from 'react-icons/md';
import Loader from '../../common/Loader';
import ConfirmationModal from '../../common/ConfirmationModal';
import CommonMethod from 'app/service/helpers/commonMethod';
import organizerNotificationService, {
  OrganizerNotificationItem,
} from '../../../service/organizer/notifications/organizerNotificationService';

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return dateStr;
  }
}

export default function NotificationsDetails() {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [detail, setDetail] = useState<OrganizerNotificationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (recipientId) fetchDetail();
  }, [recipientId]);

  async function fetchDetail() {
    try {
      setLoading(true);
      const data = await organizerNotificationService.getNotificationDetail(Number(recipientId));
      setDetail(data);
      if (!data.isRead) {
        await organizerNotificationService.markAsRead(Number(recipientId));
        setDetail(prev => prev ? { ...prev, isRead: true } : prev);
        window.dispatchEvent(
          new CustomEvent('notification-marked-read', { detail: { recipientId: Number(recipientId) } })
        );
      }
    } catch (error) {
      toast({
        title: 'Error loading notification',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!recipientId) return;
    try {
      setIsDeleting(true);
      await organizerNotificationService.deleteNotification(Number(recipientId));
      toast({ title: 'Notification deleted', status: 'success', position: 'top-right' });
      navigate('/organizer/notifications/list');
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return (
      <Flex direction="column" pt={{ sm: '125px', lg: '75px' }} align="center" justify="center" minH="400px">
        <Loader message="Loading notification..." subtitle="Please wait" />
      </Flex>
    );
  }

  if (!detail) return null;

  return (
    <Flex direction="column" pt={{ sm: '125px', lg: '75px' }} gap={4}>

      {/* Back link */}
      <HStack
        spacing={1}
        cursor="pointer"
        color="gray.500"
        _hover={{ color: 'gray.700' }}
        w="fit-content"
        onClick={() => navigate('/organizer/notifications/list')}
      >
        <MdArrowBack size={16} />
        <Text fontSize="sm">Back to Notifications</Text>
      </HStack>

      {/* Main card */}
      <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="white">

        {/* Blue header */}
        <Box bg="#2563EB" px={4} py={3}>
          <HStack spacing={3} mb={2} justify="space-between">
            <HStack spacing={3}>
              <Badge
                bg="rgba(255,255,255,0.2)"
                color="white"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="semibold"
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <Box
                  w={2}
                  h={2}
                  bg={detail.isRead ? 'green.300' : 'orange.300'}
                  borderRadius="full"
                  display="inline-block"
                />
                {detail.isRead ? 'Read' : 'Unread'}
              </Badge>
              <Text color="rgba(255,255,255,0.75)" fontSize="sm">
                {formatDate(detail.readAt || detail.sentAt)}
              </Text>
            </HStack>

            <IconButton
              aria-label="Delete notification"
              icon={<MdDelete />}
              size="sm"
              bg="rgba(255,255,255,0.15)"
              color="white"
              _hover={{ bg: 'rgba(255,255,255,0.25)' }}
              borderRadius="md"
              onClick={() => setDeleteOpen(true)}
            />
          </HStack>

          <Text color="white" fontSize="xl" fontWeight="bold">
            {detail.subject}
          </Text>
        </Box>

        {/* Body */}
        <Box px={6} py={5}>

          {/* Sender info */}
          <Box mb={5}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={3}
            >
              From
            </Text>
            <HStack spacing={3}>
              <Flex
                w="36px"
                h="36px"
                borderRadius="full"
                bg="#2563EB"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {detail.createdBy?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                  {detail.createdBy || 'System Admin'}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Delivered {formatDate(detail.deliveredAt || detail.sentAt)}
                </Text>
              </Box>
            </HStack>
          </Box>

          {/* Divider */}
          <Box borderTopWidth="1px" borderColor="gray.100" mb={5} />

          {/* Content */}
          <Box
            fontSize="sm"
            lineHeight="1.75"
            color="gray.700"
            dangerouslySetInnerHTML={{ __html: detail.content }}
            sx={{
              '& h1': { fontSize: '1.5em', fontWeight: 'bold', margin: '0.5em 0' },
              '& h2': { fontSize: '1.25em', fontWeight: 'bold', margin: '0.4em 0' },
              '& ul, & ol': { paddingLeft: '1.5em' },
              '& a': { color: '#3182CE', textDecoration: 'underline' },
              '& p': { margin: '0 0 0.5em 0' },
            }}
          />
        </Box>
      </Box>

      <ConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
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
