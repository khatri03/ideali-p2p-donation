import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { PaginationProps } from '../../../../interface/donationInter/PaginationPrpos';

export default function Pagination({
  currentPage,
  totalRecords,
  entriesPerPage,
  onPageChange,
  displayedItemsCount,
}: PaginationProps) {
  const totalPages = Math.ceil(totalRecords / entriesPerPage);
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endIndex = totalRecords === 0 ? 0 : startIndex + displayedItemsCount - 1;

  const getPageNumbers = (max: number) => {
    const pages: number[] = [];
    if (totalPages <= max) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= Math.ceil(max / 2)) {
      for (let i = 1; i <= max; i++) pages.push(i);
    } else if (currentPage >= totalPages - Math.floor(max / 2)) {
      for (let i = totalPages - (max - 1); i <= totalPages; i++) pages.push(i);
    } else {
      const half = Math.floor(max / 2);
      for (let i = currentPage - half; i <= currentPage + half; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <Box px={{ base: 3, sm: 4 }} py={4} borderTop="1px solid" borderColor="gray.100">
      {/* Mobile layout */}
      <Flex display={{ base: 'flex', sm: 'none' }} direction="column" align="center" gap={3}>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          Showing{' '}
          <Text as="span" fontWeight="bold" color="#044bd9">{startIndex}</Text>
          {' '}–{' '}
          <Text as="span" fontWeight="bold" color="#044bd9">{endIndex}</Text>
          {' '}of{' '}
          <Text as="span" fontWeight="bold" color="#044bd9">{totalRecords}</Text>
        </Text>
        <HStack spacing={1.5}>
          <Button size="sm" variant="outline" px={3}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            isDisabled={currentPage === 1}
          >
            ‹ Prev
          </Button>
          {getPageNumbers(3).map((pageNum) => (
            <Button key={pageNum} size="sm" minW="32px" px={0}
              bg={currentPage === pageNum ? '#044bd9' : 'transparent'}
              color={currentPage === pageNum ? 'white' : 'gray.800'}
              borderWidth="1px"
              borderColor={currentPage === pageNum ? '#044bd9' : 'gray.200'}
              _hover={currentPage === pageNum ? { bg: '#033fb6' } : { bg: 'gray.50' }}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
          <Button size="sm" variant="outline" px={3}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            isDisabled={currentPage === totalPages}
          >
            Next ›
          </Button>
        </HStack>
      </Flex>

      {/* Desktop layout */}
      <Flex display={{ base: 'none', sm: 'flex' }} justify="space-between" align="center" gap={4}>
        <Text fontSize="sm" color="gray.600">
          Showing{' '}
          <Text as="span" fontWeight="bold" color="#044bd9">{startIndex}</Text>
          {' '}to{' '}
          <Text as="span" fontWeight="bold" color="#044bd9">{endIndex}</Text>
          {' '}of{' '}
          <Text as="span" fontWeight="bold" color="#044bd9">{totalRecords}</Text>
          {' '}entries
        </Text>
        <HStack spacing={2}>
          <Button size="sm" variant="outline"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            isDisabled={currentPage === 1}
          >
            Previous
          </Button>
          <HStack spacing={1}>
            {getPageNumbers(5).map((pageNum) => (
              <Button key={pageNum} size="sm" minW="32px"
                bg={currentPage === pageNum ? '#044bd9' : 'transparent'}
                color={currentPage === pageNum ? 'white' : 'gray.800'}
                borderWidth="1px"
                borderColor={currentPage === pageNum ? '#044bd9' : 'gray.200'}
                _hover={currentPage === pageNum ? { bg: '#033fb6' } : { bg: 'gray.50' }}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
          </HStack>
          <Button size="sm" variant="outline"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            isDisabled={currentPage === totalPages}
          >
            Next
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
