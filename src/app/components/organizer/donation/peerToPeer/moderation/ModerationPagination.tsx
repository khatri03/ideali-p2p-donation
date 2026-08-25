import { Button, Flex, Text } from '@chakra-ui/react';
import { NEXT_PAGE, PREVIOUS_PAGE, showingRange } from './moderationCopy';

interface ModerationPaginationProps {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  onChange: (page: number) => void;
}

export const ModerationPagination = ({
  pageNo,
  pageSize,
  pageCount,
  totalRecordsCount,
  onChange,
}: ModerationPaginationProps) => {
  const isFirst = pageNo <= 1;
  const isLast = pageNo >= pageCount;

  return (
    <Flex
      align="center"
      justify="space-between"
      gap={3}
      wrap="wrap"
      direction={{ base: 'column', '2sm': 'row' }}
    >
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
        {showingRange(pageNo, pageSize, totalRecordsCount)}
      </Text>
      <Flex gap={2}>
        <Button
          size="sm"
          variant="outline"
          minH="44px"
          isDisabled={isFirst}
          onClick={() => onChange(pageNo - 1)}
          sx={{ cursor: isFirst ? 'not-allowed' : 'pointer' }}
        >
          {PREVIOUS_PAGE}
        </Button>
        <Button
          size="sm"
          variant="outline"
          minH="44px"
          isDisabled={isLast}
          onClick={() => onChange(pageNo + 1)}
          sx={{ cursor: isLast ? 'not-allowed' : 'pointer' }}
        >
          {NEXT_PAGE}
        </Button>
      </Flex>
    </Flex>
  );
};

export default ModerationPagination;
