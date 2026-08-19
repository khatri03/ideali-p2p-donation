import React from 'react';
import { Avatar, Box, Flex, Text, VStack } from '@chakra-ui/react';
import {
  profileSectionCardStyles,
  profileSectionDescriptionStyles,
} from './memberProfileStyles';

type ProfileHeaderProps = {
  name: string;
  avatarUrl?: string;
  subtitle: string;
  memberId: string;
  actions?: React.ReactNode;
};

export default function MemberProfileHeader({ name, avatarUrl, subtitle, memberId, actions }: ProfileHeaderProps) {
  return (
    <Box
      {...profileSectionCardStyles}
      borderColor="blue.100"
    >
      <Flex gap={5} align="flex-start" flexDirection={{ base: 'column', md: 'row' }}>

        {/* Avatar + info row */}
        <Flex gap={4} align="flex-start" flex="1" minW="0" w="full">
          <Avatar name={name} src={avatarUrl} size="lg" bg="blue.500" color="white" flexShrink={0} />
          <VStack align="start" spacing={1} flex="1" minW="0" overflow="hidden">
            <Text
              fontSize="10px"
              fontWeight="700"
              color="blue.500"
              letterSpacing="wider"
              textTransform="uppercase"
            >
              Member detail
            </Text>
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              fontWeight="800"
              color="gray.900"
              lineHeight="1.2"
              w="full"
              wordBreak="break-word"
            >
              {name}
            </Text>
            <Text {...profileSectionDescriptionStyles} w="full">
              {subtitle}
            </Text>
            {memberId && (
              <Text fontSize="xs" color="gray.400" w="full" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                Member ID: {memberId}
              </Text>
            )}
          </VStack>
        </Flex>

        {/* Actions */}
        {actions && (
          <Box flexShrink={0} w={{ base: 'full', md: 'auto' }}>
            {actions}
          </Box>
        )}

      </Flex>
    </Box>
  );
}
