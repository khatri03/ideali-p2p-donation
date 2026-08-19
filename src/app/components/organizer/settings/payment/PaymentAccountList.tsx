import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  useColorModeValue,
  Badge,
  HStack,
  IconButton,
  useToast,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { MdRefresh, MdAdd, MdMoreVert, MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import paymentAccountService, { PaymentAccountListItem } from '../../../../service/organizer/donation/paymentAccountService';
import Loader from '../../../common/Loader';
import Pagination from '../../donation/organizerDonationComponents/Pagination';
import AccessDenied from '../../common/AccessDenied';
import { hasPermission } from '../../../../service/organizer/rolesPermissions/permissionsService';

interface PaymentAccountListProps {
  onRefresh?: () => void;
}

const PaymentAccountList: React.FC<PaymentAccountListProps> = ({ onRefresh }) => {
  const [accounts, setAccounts] = useState<PaymentAccountListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [entriesPerPage] = useState<number>(10);
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const headerBg = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const canEdit = hasPermission('payment-account:edit');

  // If the user does not have permission to view the list, render Access Denied early
  if (!hasPermission('payment-account:list')) {
    return <AccessDenied />;
  }

  const fetchPaymentAccounts = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const response = await paymentAccountService.getPaymentAccountList(page, entriesPerPage);
      setAccounts(response.pageData);
      setTotalRecords(response.totalRecordsCount);
    } catch (error: any) {
      console.error('Error fetching payment accounts:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load payment accounts',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentAccounts();
  }, [currentPage]);

  const handleRefresh = () => {
    fetchPaymentAccounts(currentPage);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddAccount = () => {
    navigate('/organizer/setting/payment-account');
  };

  if (!loading && accounts.length === 0) {
    return (
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={8}
        mt={24}
        textAlign="center"
      >
        <Text color={textColor} fontSize="md" mb={4}>
          No payment accounts found. Create your first payment account.
        </Text>
        {hasPermission('payment-account:create') && (
          <Button
            leftIcon={<MdAdd />}
            colorScheme="blue"
            size="lg"
            onClick={handleAddAccount}
          >
            Create Payment Account
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      mt={24}
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
          Payment Accounts ({totalRecords})
        </Text>
        <HStack spacing={2}>
          {hasPermission('payment-account:create') && (
            <Button
              leftIcon={<MdAdd />}
              bg="#044bd9"
              color="white"
              _hover={{ bg: "#033fb6" }}
              size="md"
              onClick={handleAddAccount}
            >
              Add
            </Button>
          )}

          <IconButton
            aria-label="Refresh list"
            icon={<MdRefresh />}
            size="md"
            onClick={handleRefresh}
            variant="ghost"
            colorScheme="blue"
          />
        </HStack>
      </HStack>

      {loading ? (
        <Box minH="400px" display="flex" alignItems="center" justifyContent="center">
          <Loader
            message="Loading Payment Accounts..."
            subtitle="Please wait while we fetch your payment accounts"
          />
        </Box>
      ) : (
        <>
          <TableContainer>
           <Table variant="simple" size="md">
  <Thead bg={headerBg}>
    <Tr>
      {canEdit && (
        <Th fontSize="sm" color="gray.800" textTransform="uppercase" fontWeight="bold" w="80px">
          Actions
        </Th>
      )}
      <Th fontSize="sm" color="gray.800" textTransform="uppercase" fontWeight="bold">
        Account Name
      </Th>
      <Th fontSize="sm" color="gray.800" textTransform="uppercase" fontWeight="bold">
        Payment Merchant
      </Th>
      <Th fontSize="sm" color="gray.800" textTransform="uppercase" fontWeight="bold">
        Currency
      </Th>
      {/* <Th fontSize="sm" color="gray.800" textTransform="uppercase" fontWeight="bold">
        Account ID
      </Th> */}
    </Tr>
  </Thead>
  <Tbody>
    {accounts.map((account, idx) => (
    <Tr
      key={account.uniqueId}
      bg={idx % 2 === 0 ? 'white' : 'rgba(226, 232, 240, 0.44)'} // soft gray mid-shade
      _hover={{}}
    >
        {canEdit && (
          <Td>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<MdMoreVert />}
                variant="ghost"
                size="sm"
                aria-label="Actions"
                _hover={{ bg: 'gray.100' }}
              />
              <MenuList minW="120px" shadow="md">
                <MenuItem
                  icon={<MdEdit />}
                  onClick={() => navigate(`/organizer/setting/payment-account/${account.uniqueId}/edit`)}
                  fontSize="sm"
                >
                  Edit
                </MenuItem>
              </MenuList>
            </Menu>
          </Td>
        )}
        <Td>
          <Text fontWeight="medium" color={textColor}>
            {account.name}
          </Text>
        </Td>
        <Td>
          <Badge
            bg={account.paymentMerchant === 'Stripe' ? '#6425EB' : 'blue'}
            color="white"
            fontSize="xs"
            px={3}
            py={1}
            borderRadius="md"
          >
            {account.paymentMerchant}
          </Badge>
        </Td>
        <Td>
          <Text color={textColor} fontWeight="medium">
            {account.paymentCurrency}
          </Text>
        </Td>
        {/* <Td>
          <Text fontSize="sm" color="gray.500" fontFamily="monospace">
            {account.uniqueId.substring(0, 13)}...
          </Text>
        </Td> */}
      </Tr>
    ))}
  </Tbody>
</Table>

          </TableContainer>

          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            entriesPerPage={entriesPerPage}
            onPageChange={handlePageChange}
            displayedItemsCount={accounts.length}
          />
        </>
      )}
    </Box>
  );
};

export default PaymentAccountList;
