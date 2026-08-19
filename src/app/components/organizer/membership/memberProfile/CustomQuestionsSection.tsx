import React from 'react';
import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import {
  profileEyebrowStyles,
  profileSectionCardStyles,
  profileSectionDescriptionStyles,
  profileSectionTitleStyles,
  profileValueStyles,
} from './memberProfileStyles';

type Question = {
  label: string;
  value: string;
};

export default function CustomQuestionsSection({ questions }: { questions: Question[] }) {
  return (
    <Box {...profileSectionCardStyles}>
      <Text {...profileSectionTitleStyles} mb={1}>
        Custom questions
      </Text>
      <Text {...profileSectionDescriptionStyles} mb={4}>
        Individual question responses captured at registration time.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
        {questions.length > 0 ? (
          questions.map((question) => (
            <Box key={question.label} bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}>
              <Text {...profileEyebrowStyles} mb={1}>
                {question.label}
              </Text>
              <Text {...profileValueStyles}>
                {question.value}
              </Text>
            </Box>
          ))
        ) : (
          <Box gridColumn="1 / -1" bg="gray.50" border="1px dashed" borderColor="gray.200" borderRadius="xl" p={4}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              No custom question responses found.
            </Text>
          </Box>
        )}
      </SimpleGrid>
    </Box>
  );
}
