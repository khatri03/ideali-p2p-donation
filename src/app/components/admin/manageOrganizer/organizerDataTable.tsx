/* eslint-disable */
import { Badge, Button, Flex, Box, HStack, Text, useColorModeValue, IconButton } from '@chakra-ui/react';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdVisibility } from 'react-icons/md';
import { DynamicTable, Column } from '../../organizer/donation/organizerDonationComponents/DynamicTable';
import Pagination from '../../organizer/donation/organizerDonationComponents/Pagination';

type RowObj = {
  name: string;
  modules: string;
  status: string;
  emailAddress: string;
  organizerUniqueId: string; 
};

type ServerTableProps = {
  data: RowObj[];
  totalRows: number;
  pageIndex: number;
  pageSize: number;
  loading?: boolean;
  onPaginationChange: (updater: { pageIndex?: number; pageSize?: number }) => void;
};

export default function SearchTableOrganizer(props: ServerTableProps) {
  const { data: tableData, totalRows, pageIndex, pageSize, loading, onPaginationChange } = props;
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');

  const handleViewProfile = (organizerUniqueId: string) => {
    
    navigate(`/admin/manage-organizer/profile/${organizerUniqueId}`);
  };

  const columns: Column<RowObj>[] = [
    {
      key: 'name',
      header: 'Organizer Name',
      width: '300px',
      render: (_: any, row: RowObj) => (
        <Text fontWeight="medium">
          {row.name}
        </Text>
      )
    },
    {
      key: 'emailAddress',
      header: 'Email Address',
      width: '250px',
      render: (_: any, row: RowObj) => (
        <Text color={textColor}>
          {row.emailAddress || 'N/A'}
        </Text>
      )
    },
    {
      key: 'modules',
      header: 'Modules',
      width: '350px',
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (_: any, row: RowObj) => (
        <Flex justifyContent="flex-start">
          <Badge
            colorScheme={row.status === "Active" ? "green" : "red"}
            color={row.status === "Active" ? "green.500" : "red.500"}
            fontSize='sm'
            fontWeight='400'
          >
            {row.status}
          </Badge>
        </Flex>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (_: any, row: RowObj) => (
        console.log('Row Data:', row),
        <Flex justifyContent="center">
          <IconButton
            aria-label="View profile"
            icon={<MdVisibility />}
            size="sm"
            colorScheme="blue"
            variant="ghost"
            onClick={() => handleViewProfile(row.organizerUniqueId)}
            _hover={{ bg: 'blue.50' }}
          />
        </Flex>
      )
    }
  ];

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      <HStack
        justify="space-between"
        align="center"
        px={6}
        py={4}
        bg="white"
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <Text fontSize="lg" fontWeight="bold" color={textColor}>
          Organizers ({totalRows})
        </Text>
        <Button
          leftIcon={<MdAdd />}
          onClick={() => navigate('/admin/manage-organizer/create')}
          bg="#044bd9"
          color="white"
          _hover={{ bg: "#033fb6" }}
          size="md"
        >
          Add
        </Button>
      </HStack>

      <DynamicTable
        data={tableData}
        columns={columns}
        isLoading={loading}
        emptyMessage="No organizers found."
      />

      {tableData.length > 0 && (
        <Pagination
          currentPage={pageIndex + 1}
          totalRecords={totalRows}
          entriesPerPage={pageSize}
          onPageChange={(page: number) => onPaginationChange({ pageIndex: page - 1 })}
          displayedItemsCount={tableData.length}
        />
      )}
    </Box>
  );
}