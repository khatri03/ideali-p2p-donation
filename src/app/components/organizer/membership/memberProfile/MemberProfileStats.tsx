import React from 'react';
import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { MdCalendarMonth, MdOutlineSchedule, MdVerified } from 'react-icons/md';
import {
  profileEyebrowStyles,
} from './memberProfileStyles';

type ProfileStatsProps = {
  activeMembership: string;
  status: string;
  memberSince: string;
  expireAt: string;
};

const stats = [
  { key: 'activeMembership', label: 'Active Membership', icon: MdVerified, color: 'blue.50', border: 'blue.200' },
  { key: 'status', label: 'Status', icon: MdVerified },
  { key: 'memberSince', label: 'Member Since', icon: MdCalendarMonth, color: 'gray.50', border: 'gray.200' },
  { key: 'expireAt', label: 'Expire', icon: MdOutlineSchedule, color: 'red.50', border: 'red.200' },
] as const;

const getStatusStyles = (status: string) => {
  const normalized = status?.trim().toLowerCase().replace(/\s+/g, '');

  if (normalized === 'rejected') {
    return { bg: 'red.50', border: 'red.200' };
  }

  if (normalized === 'pending' || normalized === 'pendingapproval' || normalized === 'pendingapproval') {
    return { bg: 'yellow.50', border: 'yellow.200' };
  }

  if (normalized === 'active') {
    return { bg: 'green.50', border: 'green.200' };
  }

  return { bg: 'gray.50', border: 'gray.200' };
};

export default function MemberProfileStats({ activeMembership, status, memberSince, expireAt }: ProfileStatsProps) {
  const statusStyles = getStatusStyles(status);

  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={3} mt={4}>
      {stats.map((stat) => {
        const isStatus = stat.key === 'status';
        return (
          <Box
            key={stat.key}
            bg={isStatus ? statusStyles.bg : stat.color}
            border="1px solid"
            borderColor={isStatus ? statusStyles.border : stat.border}
            borderRadius="xl"
            p={5}
            minH="88px"
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Text {...profileEyebrowStyles} mb={1}>
              {stat.label}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="700"
              color="gray.900"
              lineHeight="1.45"
              wordBreak="break-word"
            >
              {stat.key === 'activeMembership'
                ? activeMembership
                : stat.key === 'status'
                ? status
                : stat.key === 'memberSince'
                ? memberSince
                : expireAt}
            </Text>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
