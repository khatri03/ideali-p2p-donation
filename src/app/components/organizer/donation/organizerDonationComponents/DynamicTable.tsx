import { Column as ZebraColumn, ZebraTbody } from "../../../common/ZebraTable";
import { 
  Box, 
  Card, 
  CardBody, 
  TableContainer,
  Table, 
  Thead, 
  Tr, 
  Th, 
  Text 
} from "@chakra-ui/react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
}

interface DynamicTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DynamicTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  emptyMessage = "No data found.",
  isLoading = false 
}: DynamicTableProps<T>) {
  
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text textAlign="center" color="gray.500">
            {emptyMessage}
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody p={0}>
        <TableContainer>
          <Table variant="simple">
            <Thead bg="gray.200">
              <Tr>
                {columns.map((column) => (
                  <Th key={column.key} width={column.width} color="gray.800" fontWeight="bold" fontSize="sm" textTransform="uppercase">
                    {column.header}
                  </Th>
                ))}
              </Tr>
            </Thead>
            {/* Pass data and columns to ZebraTbody */}
            <ZebraTbody data={data} columns={columns} />
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  );
}
