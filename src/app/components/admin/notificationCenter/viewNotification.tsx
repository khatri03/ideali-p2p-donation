import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { MdArrowBack, MdDelete, MdEdit, MdSend } from 'react-icons/md';
import Loader from '../../common/Loader';
import ConfirmationModal from '../../common/ConfirmationModal';
import { isRealAdmin } from '../../../service/organizer/rolesPermissions/permissionsService';
import CommonMethod from 'app/service/helpers/commonMethod';
import notificationService, { NotificationDetail } from '../../../service/admin/notificationService';

// ─── Avatar colours cycling through a palette ─────────────────────────────────

const AVATAR_COLORS = [
  { bg: '#4A90D9', text: '#fff' },
  { bg: '#E066A0', text: '#fff' },
  { bg: '#2DB88A', text: '#fff' },
  { bg: '#F5A623', text: '#fff' },
  { bg: '#7B68EE', text: '#fff' },
  { bg: '#E05353', text: '#fff' },
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewNotification() {
  const { notificationId } = useParams<{ notificationId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [detail, setDetail] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isRealAdmin()) {
      navigate('/auth/sign-in/custom');
      return;
    }
    fetchDetail();
  }, [notificationId]);

  async function fetchDetail() {
    if (!notificationId) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotificationDetail(Number(notificationId));
      setDetail(data);
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

  async function handleResend() {
    if (!notificationId) return;
    try {
      setIsResending(true);
      const response = await notificationService.resendNotification(Number(notificationId));
      toast({
        title: 'Notification Resent',
        description: response.message || 'Notification resent successfully.',
        status: 'success',
        position: 'top-right',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: CommonMethod.ErrorMessage(error),
        status: 'error',
        position: 'top-right',
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleDelete() {
    if (!notificationId) return;
    try {
      setIsDeleting(true);
      await notificationService.deleteNotification(Number(notificationId));
      toast({
        title: 'Notification Deleted',
        status: 'success',
        position: 'top-right',
      });
      navigate('/admin/notification-center/list');
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
        <Loader message="Loading Notification..." subtitle="Please wait" />
      </Flex>
    );
  }

  if (!detail) return null;

  const isSent = detail.status === 'Sent';

  return (
    <Flex direction="column" pt={{ sm: '125px', lg: '75px' }} gap={4}>

      {/* ── Back link ── */}
      <HStack
        spacing={1}
        cursor="pointer"
        color="gray.500"
        _hover={{ color: 'gray.700' }}
        w="fit-content"
        onClick={() => navigate('/admin/notification-center/list')}
      >
        <MdArrowBack size={16} />
        <Text fontSize="sm">Back to Notifications</Text>
      </HStack>

      {/* ── Main card ── */}
      <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="white">

        {/* Blue header */}
        <Box bg="#2563EB" px={4} py={3}>
          <HStack spacing={3} mb={2}>
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
              <Box w={2} h={2} bg={isSent ? 'green.300' : 'red.300'} borderRadius="full" display="inline-block" />
              {detail.status}
            </Badge>
            <Text color="rgba(255,255,255,0.75)" fontSize="sm">
              {formatDate(detail.sentAt)}
            </Text>
          </HStack>
          <Text color="white" fontSize="xl" fontWeight="bold">
            {detail.subject}
          </Text>
        </Box>

        {/* Body */}
        <Box px={6} py={5}>

          {/* Recipients */}
          {detail.recipients && detail.recipients.length > 0 && (
            <Box mb={5}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={3}
              >
                Recipients
              </Text>
              <Flex gap={4} wrap="wrap">
                {detail.recipients.map((r, idx) => {
                  const color = avatarColor(idx);
                  const initial = r.organizerName?.charAt(0).toUpperCase() || '?';
                  return (
                    <HStack key={r.id} spacing={2}>
                      {/* Avatar circle */}
                      <Flex
                        w="28px"
                        h="28px"
                        borderRadius="full"
                        bg={color.bg}
                        color={color.text}
                        align="center"
                        justify="center"
                        fontSize="xs"
                        fontWeight="bold"
                        flexShrink={0}
                      >
                        {initial}
                      </Flex>
                      <Text fontSize="sm" color="gray.700">
                        <Text as="span" fontWeight="medium">
                          {r.organizerName}
                        </Text>
                        {r.latestStatus?.status && (
                          <Text as="span" color="gray.400" ml={1} fontSize="xs">
                            ({r.latestStatus.status})
                          </Text>
                        )}
                      </Text>
                    </HStack>
                  );
                })}
              </Flex>
            </Box>
          )}

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

        {/* ── Action bar ── */}
        {/* <Flex
          justify="space-between"
          align="center"
          px={6}
          py={4}
          borderTopWidth="1px"
          borderColor="gray.100"
        >
          <HStack spacing={3}>
            <Button
              leftIcon={<MdEdit />}
              size="sm"
              bg="#044bd9"
              color="white"
              _hover={{ bg: '#033fb6' }}
              onClick={() => navigate(`/admin/notification-center/edit/${notificationId}`)}
            >
              Edit
            </Button>
            <Button
              leftIcon={<MdSend />}
              size="sm"
              colorScheme="green"
              isLoading={isResending}
              loadingText="Resending..."
              onClick={handleResend}
            >
              Resend
            </Button>
          </HStack>

          <Button
            leftIcon={<MdDelete />}
            size="sm"
            colorScheme="red"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </Flex> */}
      </Box>

      {/* ── Delete confirmation ── */}
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
