import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

export type MemberProfileTabItem = {
  key: string;
  label: string;
};

type Props = {
  tabs: MemberProfileTabItem[];
  activeTabKey: string;
  onTabChange: (tabKey: string) => void;
};

export default function MemberProfileTabs({ tabs, activeTabKey, onTabChange }: Props) {
  return (
    <Flex
      mt={4}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      overflow="hidden"
      bg="white"
      direction={{ base: 'column', md: 'row' }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === activeTabKey;

        return (
          <Box
            key={tab.key}
            flex="1"
            py={3}
            textAlign="center"
            borderRight={index < tabs.length - 1 ? '1px solid' : 'none'}
            borderBottom={{ base: index < tabs.length - 1 ? '1px solid' : 'none', md: 'none' }}
            borderColor="gray.200"
            bg={isActive ? 'blue.50' : 'white'}
            cursor="pointer"
            onClick={() => onTabChange(tab.key)}
            _hover={{ bg: isActive ? 'blue.50' : 'gray.50' }}
          >
            <Text fontSize="sm" fontWeight={isActive ? '700' : '600'} color={isActive ? 'blue.600' : 'gray.500'}>
              {tab.label}
            </Text>
          </Box>
        );
      })}
    </Flex>
  );
}
