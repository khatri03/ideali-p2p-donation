import React, { useEffect } from 'react';
import { Box, Heading, Text, useColorModeValue, SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { isRealAdmin } from '../../../service/organizer/rolesPermissions/permissionsService';

// Reusable MetricCard component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, bgColor }) => {
  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      p={6}
      color="white"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      minH="140px"
      boxShadow="md"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
    >
      <Text fontSize="3xl" fontWeight="bold" mb={2}>
        {value}
      </Text>
      <Box>
        <Text fontSize="sm" fontWeight="medium" opacity={0.9}>
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="xs" mt={1} opacity={0.8}>
            {subtitle}
          </Text>
        )}
      </Box>
    </Box>
  );
};

// Reusable Table Card component
interface TableCardProps {
  title: string;
  bgColor: string;
  headers: string[];
  rows: (string | number)[][];
  icon?: string;
}

const TableCard: React.FC<TableCardProps> = ({ title, bgColor, headers, rows, icon = '🏠' }) => {
  const tableBg = useColorModeValue('white', 'gray.800');
  const headerColor = useColorModeValue('gray.600', 'gray.400');
  const rowBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      bg={tableBg}
      w="100%"
      border="1px solid"
      borderColor={borderColor}
    >
      <Box bg={bgColor} color="white" p={3} display="flex" alignItems="center" gap={2}>
        <Text fontSize="sm">{icon}</Text>
        <Heading size="sm" fontWeight="semibold">
          {title}
        </Heading>
      </Box>
      <Box w="100%" overflowX="auto" overflowY="hidden">
        <Table variant="simple" size="sm">
          <Thead bg={rowBg}>
            <Tr>
              {headers.map((header, index) => (
                <Th 
                  key={index} 
                  color={headerColor} 
                  fontWeight="600" 
                  py={3}
                  px={4}
                  fontSize="xs"
                  textTransform="none"
                  whiteSpace="nowrap"
                  borderBottom="1px solid"
                  borderColor={borderColor}
                >
                  {header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <Td 
                    key={cellIndex} 
                    py={3}
                    px={4}
                    fontSize="sm"
                    whiteSpace="nowrap"
                    borderBottom={rowIndex !== rows.length - 1 ? "1px solid" : "none"}
                    borderColor={borderColor}
                  >
                    {cell}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default function Overview() {
  const navigate = useNavigate();

  // Permission check is handled by the parent AdminDashboard component
  const textColor = useColorModeValue('#1B2559', '#FFFFFF');
  const secondaryColor = useColorModeValue('#A3AED0', '#A3AED0');
  const chartBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Pie chart data for module distribution
  const moduleDistributionData = [
    { name: 'Donations', value: 86, color: '#4ECDC4' },
    { name: 'Memberships', value: 12, color: '#4A90E2' },
    { name: 'Events', value: 4.4, color: '#FF8C42' },
    { name: 'Exhibitions', value: 2, color: '#E74C3C' },
    { name: 'Trips', value: 11, color: '#9B59B6' },
  ];

  // Dummy data for metric cards
  const metricsData = [
    {
      title: 'Total Users',
      value: '3944',
      subtitle: '3944',
      bgColor: '#5B7C99',
    },
    {
      title: 'Users as Members',
      value: '1005',
      subtitle: '1005',
      bgColor: '#5B7C99',
    },
    {
      title: 'Zano Transactions as Non Members',
      value: '2939',
      subtitle: '2939',
      bgColor: '#5B7C99',
    },
    {
      title: 'Transactions as Members',
      value: '1566',
      subtitle: '1566',
      bgColor: '#5B7C99',
    },
    {
      title: 'Total Transactions',
      value: '3864',
      subtitle: '18,200,712.90',
      bgColor: '#5B7C99',
    },
    {
      title: 'Membership Types',
      value: '192',
      subtitle: '1,903,414.00',
      bgColor: '#4A9FD8',
    },
    {
      title: 'Events',
      value: '157',
      subtitle: '7,945,089.78',
      bgColor: '#FF8C42',
    },
    {
      title: 'Donation',
      value: '3086',
      subtitle: '848,641.00',
      bgColor: '#4ECDC4',
    },
    {
      title: 'Exhibition',
      value: '94',
      subtitle: '12,056,845.00',
      bgColor: '#E74C3C',
    },
    {
      title: 'Trips and Tours',
      value: '40',
      subtitle: '422,747.12',
      bgColor: '#9B59B6',
    },
  ];

  // Dummy data for Membership Transactions Count table
  const membershipCountData = {
    title: 'Membership Transactions Count',
    bgColor: '#4A90E2',
    icon: '🏠',
    headers: ['', 'Total Members', 'New', 'Renewals', 'Expired', 'Active Members'],
    rows: [
      ['Current Year', '102', '74', '28', '1068', '486'],
      ['All since system in use', '1424', '760', '664', '1084', '522'],
    ],
  };

  // Dummy data for Membership Transactions Amount table
  const membershipAmountData = {
    title: 'Membership Transactions Amount',
    bgColor: '#4A90E2',
    icon: '🏠',
    headers: ['', 'Total Members', 'New', 'Renewals', 'Expired', 'Active Members'],
    rows: [
      ['Current Year', '283,096.00', '273,886.00', '9,210.00', '1,359,116.00', '693,888.00'],
      ['All since', '1,993,414.00', '1,553,423.00', '439,991.00', '1,368,148.00', '719,759.00'],
    ],
  };

  // Dummy data for Exhibitions table
  const exhibitionsData = {
    title: 'Exhibitions',
    bgColor: '#E74C3C',
    icon: '🎨',
    headers: ['', 'Grand Total', 'Exhibition', 'BoothNo'],
    rows: [
      ['Current Year', '6,447.00', '3', '29'],
      ['All since system in use', '12,090,845.00', '94', '1717'],
    ],
  };

  // Dummy data for Trips and Tours table
  const tripsToursData = {
    title: 'Trips and Tours All',
    bgColor: '#9B59B6',
    icon: '✈️',
    headers: ['', 'Grand Total', 'Trips & Tours', 'Quantity'],
    rows: [
      ['Current Year', '97,688.96', '10', '117'],
      ['All since system in use', '422,747.12', '40', '790'],
    ],
  };

  return (
    <Box style={{ marginTop: '94px' }}>
      <Heading color={textColor} mb={2}>
        Overview
      </Heading>
      <Text color={secondaryColor} mb={6}>
        Admin Dashboard Overview 
      </Text>

      {/* Metric Cards Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={4} mb={8}>
        {metricsData.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            bgColor={metric.bgColor}
          />
        ))}
      </SimpleGrid>

      {/* Pie Chart Section */}
<Box 
  mb={8} 
  bg={chartBg} 
  borderRadius="lg" 
  p={6} 
  boxShadow="md"
  border="1px solid"
  borderColor={borderColor}
>
  <Heading size="md" color={textColor} mb={4}>
    Member Distribution by Module
  </Heading>

  {/* Wrapping div handles focus instead of ResponsiveContainer */}
  <Box
    width="100%"
    height="400px"
    tabIndex={-1}
    onMouseDown={(e) => e.preventDefault()}
    onFocus={(e) => {
      try {
        e.currentTarget.blur();
      } catch {}
    }}
  >
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={moduleDistributionData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) =>
            `${name}: ${((percent || 0) * 100).toFixed(1)}%`
          }
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          activeShape={null as any}  // disables the focus/outline box
          isAnimationActive={false}  // ensures stable rendering
          onClick={(data: any, index: number, e: any) => {
            try {
              e?.target?.blur?.();
              e?.currentTarget?.ownerSVGElement?.blur?.();
            } catch {}
          }}
        >
          {moduleDistributionData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              tabIndex={-1}
              onFocus={() => {}}
              onMouseDown={(ev) => ev.preventDefault()}
            />
          ))}
        </Pie>

        <Tooltip 
          formatter={(value) => `${value}%`}
          contentStyle={{ 
            backgroundColor: chartBg, 
            border: `1px solid ${borderColor}`,
            borderRadius: '8px' //tesct
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => (
            <span style={{ color: textColor }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  </Box>
</Box>


      {/* Tables Section */}
      <Box mb={8}>
        <TableCard {...membershipCountData} />
      </Box>

      <Box mb={8}>
        <TableCard {...membershipAmountData} />
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <TableCard {...exhibitionsData} />
        <TableCard {...tripsToursData} />
      </SimpleGrid>
    </Box>
  );
}