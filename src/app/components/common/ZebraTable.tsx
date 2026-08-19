import React from "react";
import { Tr, Td } from "@chakra-ui/react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
}

type ZebraTbodyProps<T> = {
  data: T[];
  columns: Column<T>[];
};

export const ZebraTbody = <T extends Record<string, any>>({
  data,
  columns,
}: ZebraTbodyProps<T>) => (
  <tbody>
    {data.map((row, rowIndex) => (
      <Tr
        key={rowIndex}
        bg={(rowIndex + 1) % 2 === 0 ? "rgba(226, 232, 240, 0.44)" : "white"} // gray.200 @ 60%
      >
        {columns.map((column) => (
          <Td key={column.key} color="gray.700">
            {column.render
              ? column.render(row[column.key], row, rowIndex)
              : row[column.key] ?? "-"}
          </Td>
        ))}
      </Tr>
    ))}
  </tbody>
);

export default ZebraTbody;
