import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  HStack,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { MdArrowBack, MdPerson, MdCheck } from 'react-icons/md';
import Loader from '../../common/Loader';
import StatusBadge from '../../common/StatusBadge';
import CommonMethod from 'app/service/helpers/commonMethod';
import memberNotificationService, {
  MemberNotificationItem,
} from '../services/memberNotificationService';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return dateStr;
  }
}

export default function NotificationsDetails() {
  const { uniqueId } = useParams<{ uniqueId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [detail, setDetail] = useState<MemberNotificationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uniqueId) fetchDetail();
  }, [uniqueId]);

  async function fetchDetail() {
    try {
      setLoading(true);
      const data = await memberNotificationService.getNotificationDetail(uniqueId!);
      setDetail(data);
      // Viewing the detail page counts as reading it — no separate action needed.
      if (!data.isRead) {
        memberNotificationService.markAsRead(uniqueId!).catch(() => {});
        setDetail(prev => prev ? { ...prev, isRead: true } : prev);
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

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="400px" pt={16}>
        <Loader message="Loading notification..." subtitle="Please wait" />
      </Flex>
    );
  }

  if (!detail) return null;

  return (
    <Flex direction="column" gap={4} pt={16}>

      {/* Back link */}
      <HStack
        spacing={1}
        cursor="pointer"
        color="#2563EB"
        _hover={{ textDecoration: 'underline' }}
        w="fit-content"
        fontSize="sm"
        fontWeight="500"
        onClick={() => navigate('/member/notifications/list')}
      >
        <MdArrowBack size={16} />
        <Text>Back to notifications</Text>
      </HStack>

      {/* Main card */}
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.100"
        borderRadius="xl"
        boxShadow="0 1px 3px rgba(0,0,0,0.06)"
        px={6}
        py={6}
      >
        {/* Title row */}
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={2} mb={1}>
          <HStack spacing={2}>
            <Text fontSize="lg" fontWeight="700" color="gray.900">
              {detail.title}
            </Text>
            <StatusBadge
              label={detail.priority}
              variant="status"
            />
          </HStack>
          <HStack spacing={3} flexShrink={0}>
            <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
              {formatDate(detail.sentAtUtc)}
            </Text>
            <HStack spacing={1} color="green.500">
              <Icon as={MdCheck} boxSize={3.5} />
              <Text fontSize="xs" fontWeight="600">Read</Text>
            </HStack>
          </HStack>
        </Flex>

        {/* Sender */}
        <HStack spacing={1.5} color="gray.500" mb={4}>
          <Icon as={MdPerson} boxSize={3.5} />
          <Text fontSize="xs">From {detail.sentBy || 'System'}</Text>
        </HStack>

        {/* Body */}
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="lg"
          bg="white"
          px={4}
          py={4}
          fontSize="sm"
          lineHeight="1.75"
          color="gray.700"
          dangerouslySetInnerHTML={{ __html: detail.body }}
          sx={{
            '& h1': { fontSize: '1.5em', fontWeight: 'bold', margin: '0.5em 0' },
            '& h2': { fontSize: '1.25em', fontWeight: 'bold', margin: '0.4em 0' },
            '& ul, & ol': { paddingLeft: '1.5em' },
            '& a': { color: '#3182CE', textDecoration: 'underline' },
            '& p': { margin: '0 0 0.5em 0' },
          }}
        />
      </Box>
    </Flex>
  );
}
