import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import * as React from 'react';
import { MdDelete, MdEdit, MdSend, MdVisibility } from 'react-icons/md';
import { DynamicTable, Column } from '../../organizer/donation/organizerDonationComponents/DynamicTable';
import Pagination from '../../organizer/donation/organizerDonationComponents/Pagination';
import { NotificationListItem } from '../../../service/admin/notificationService';

type NotificationRow = {
  id: number;
  subject: string;
  recipientNames: string;
  extraCount: number;
  recipientCount: number;
  date: string;
  status: string;
};

type NotificationDataTableProps = {
  data: NotificationListItem[];
  totalRows: number;
  pageIndex: number;
  pageSize: number;
  loading?: boolean;
  onPaginationChange: (updater: { pageIndex?: number; pageSize?: number }) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onResend: (id: number) => void;
  onDelete: (id: number) => void;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function mapToRows(items: NotificationListItem[]): NotificationRow[] {
  return items.map((item) => {
    const names = item.organizerNames ?? [];
    const visibleNames = names.slice(0, 2);
    const extraCount = names.length - visibleNames.length;
    return {
      id: item.id,
      subject: item.subject || '-',
      recipientNames: visibleNames.length > 0 ? visibleNames.join(', ') : '-',
      extraCount: extraCount > 0 ? extraCount : 0,
      recipientCount: item.recipientCount || 0,
      date: formatDate(item.sentAt),
      status: item.status || '-',
    };
  });
}

export default function NotificationDataTable(props: NotificationDataTableProps) {
  const {
    data,
    totalRows,
    pageIndex,
    pageSize,
    loading,
    onPaginationChange,
    onView,
    onEdit,
    onResend,
    onDelete,
  } = props;

  const textColor = useColorModeValue('gray.700', 'white');

  const tableRows = mapToRows(data);

  const columns: Column<NotificationRow>[] = [
    {
      key: 'subject',
      header: 'Subject',
      width: '500px',
      render: (_: any, row: NotificationRow) => (
        <Text fontSize="large"  fontWeight="normal" color={textColor}>
          {row.subject}
        </Text>
      ),
    },
    {
      key: 'recipients',
      header: 'Recipients',
      width: '300px',
      render: (_: any, row: NotificationRow) => (
        <Box>
          <Text fontSize="medium" color={textColor} fontWeight="small">
            {row.recipientNames}
            {row.extraCount > 0 && (
              <Text as="span" color="gray.500" fontWeight="normal"> +{row.extraCount} more</Text>
            )}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {row.recipientCount} organiser{row.recipientCount !== 1 ? 's' : ''}
          </Text>
        </Box>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      //align: 'center',
      width: '300px',
      render: (_: any, row: NotificationRow) => (
        <Text fontSize="sm" color={textColor}>
          {row.date}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      //align: 'center',
      width: '200px',
      render: (_: any, row: NotificationRow) => (
        <Flex justify="center">
          <Badge
            colorScheme={row.status === 'Sent' ? 'green' : row.status === 'Failed' ? 'red' : 'gray'}
            color={row.status === 'Sent' ? 'green.600' : row.status === 'Failed' ? 'red.600' : 'gray.600'}
            fontSize="xs"
            px={2}
            py={0.5}
            borderRadius="full"
            display="flex"
            alignItems="center"
            gap={1}
          >
            {row.status === 'Sent' && '✓ '}
            {row.status === 'Failed' && '⊗ '}
            {row.status}
          </Badge>
        </Flex>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '160px',
      //headerAlign: 'right',
      render: (_: any, row: NotificationRow) => (
        <HStack spacing={1} justify="flex-end">
          <Tooltip label="View" fontSize="xs">
            <IconButton
              aria-label="View notification"
              icon={<MdVisibility />}
              size="sm"
              colorScheme="blue"
              variant="ghost"
              onClick={() => onView(row.id)}
            />
          </Tooltip>
          <Tooltip label="Edit" fontSize="xs">
            <IconButton
              aria-label="Edit notification"
              icon={<MdEdit />}
              size="sm"
              colorScheme="gray"
              variant="ghost"
              onClick={() => onEdit(row.id)}
            />
          </Tooltip>
          <Tooltip label="Resend" fontSize="xs">
            <IconButton
              aria-label="Resend notification"
              icon={<MdSend />}
              size="sm"
              colorScheme="green"
              variant="ghost"
              onClick={() => onResend(row.id)}
            />
          </Tooltip>
          <Tooltip label="Delete" fontSize="xs">
            <IconButton
              aria-label="Delete notification"
              icon={<MdDelete />}
              size="sm"
              colorScheme="red"
              variant="ghost"
              onClick={() => onDelete(row.id)}
            />
          </Tooltip>
        </HStack>
      ),
    },
  ];

  return (
    <>
      <DynamicTable
        data={tableRows}
        columns={columns}
        isLoading={loading}
        emptyMessage="No notifications found."
      />
      {tableRows.length > 0 && (
        <Pagination
          currentPage={pageIndex + 1}
          totalRecords={totalRows}
          entriesPerPage={pageSize}
          onPageChange={(page: number) => onPaginationChange({ pageIndex: page - 1 })}
          displayedItemsCount={tableRows.length}
        />
      )}
    </>
  );
}
