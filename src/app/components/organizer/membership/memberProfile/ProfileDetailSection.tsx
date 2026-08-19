import React from 'react';
import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import {
  profileEyebrowStyles,
  profileSectionCardStyles,
  profileSectionDescriptionStyles,
  profileSectionTitleStyles,
  profileValueStyles,
} from './memberProfileStyles';

type Item = {
  label: string;
  value: string;
  icon: IconType;
  colSpan?: number;
};

type Props = {
  title: string;
  description: string;
  items: Item[];
  addressItems: Item[];
};

function DetailTile({ item }: { item: Item }) {
  return (
    <Box
      {...profileSectionCardStyles}
      borderColor="blue.100"
      w="100%"
      maxW="100%"
      minW={0}
    >
      <Flex direction="column" gap={1}>
        <Flex align="center" gap={1.5} minW={0}>
          <Box color="gray.400" flexShrink={0} display="flex" alignItems="center">
            <Icon as={item.icon} boxSize={3.5} />
          </Box>
          <Text {...profileEyebrowStyles} mb={0} noOfLines={1}>
            {item.label}
          </Text>
        </Flex>
        <Text {...profileValueStyles}>
          {item.value}
        </Text>
      </Flex>
    </Box>
  );
}

export default function ProfileDetailSection({
  title,
  description,
  items,
  addressItems,
}: Props) {
  return (
    <Box
      {...profileSectionCardStyles}
    >
      <Text {...profileSectionTitleStyles} mb={1}>
        {title}
      </Text>
      <Text {...profileSectionDescriptionStyles} mb={4}>
        {description}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        {items.map((item) => (
          <Box
            key={item.label}
            gridColumn={{ base: 'auto', md: item.colSpan ? `span ${item.colSpan}` : 'auto' }}
          >
            <DetailTile item={item} />
          </Box>
        ))}
      </SimpleGrid>

      <Box
        mt={4}
        p={4}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="xl"
      >
        <Text {...profileSectionTitleStyles} mb={3}>
          Address
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {addressItems.map((item) => (
            <DetailTile key={item.label} item={item} />
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
