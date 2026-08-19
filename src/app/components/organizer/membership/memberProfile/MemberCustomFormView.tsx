import React from 'react';
import {
  Box,
  Checkbox,
  Flex,
  Input,
  SimpleGrid,
  Text,
  Textarea,
} from '@chakra-ui/react';
import type {
  MemberCustomFormDetailResponse,
  MemberCustomFormFieldItem,
} from '../services/memberProfileService';
import {
  profileSectionCardStyles,
  profileSectionDescriptionStyles,
  profileSectionTitleStyles,
} from './memberProfileStyles';

function normalizeLayoutColumn(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return 1;
  return Math.max(1, Math.min(4, Math.trunc(value ?? 1)));
}

function getColumnSpan(
  fieldLayoutColumn: number | null | undefined,
  fallbackLayoutColumn: number,
) {
  const layoutColumn = normalizeLayoutColumn(
    fieldLayoutColumn ?? fallbackLayoutColumn,
  );
  switch (layoutColumn) {
    case 1:
      return 12;
    case 2:
      return 6;
    case 3:
      return 4;
    case 4:
      return 3;
    default:
      return 12;
  }
}

function formatFieldValue(field: MemberCustomFormFieldItem) {
  const value = field.value ?? '';
  if (field.fieldType.toLowerCase() === 'checkbox') {
    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase())
      ? 'Checked'
      : 'Unchecked';
  }
  if (field.fileOriginalFileName) return field.fileOriginalFileName;
  return value || 'Not provided';
}

function FieldCard({
  field,
  fallbackLayoutColumn,
}: {
  field: MemberCustomFormFieldItem;
  fallbackLayoutColumn: number;
}) {
  const span = getColumnSpan(field.fieldLayoutColumn, fallbackLayoutColumn);
  const value = formatFieldValue(field);
  const controlType = field.fieldType.toLowerCase();

  return (
    <Box
      gridColumn={{ base: 'auto', md: `span ${span} / span ${span}` }}
      border="1px solid"
      borderColor="blue.100"
      borderRadius="2xl"
      p={4}
      bg="white"
      boxShadow="sm"
    >
      <Text {...profileSectionTitleStyles} mb={3}>
        {field.fieldLabel}
      </Text>

      {controlType === 'checkbox' ? (
        <Flex align="center" minH="44px">
          <Checkbox
            isChecked={value === 'Checked'}
            pointerEvents="none"
            colorScheme="gray"
          >
            <Text as="span" fontSize="sm" color="gray.700">
              {value}
            </Text>
          </Checkbox>
        </Flex>
      ) : controlType === 'textarea' ? (
        <Textarea
          value={value}
          isReadOnly
          minH="100px"
          bg="white"
          borderRadius="xl"
        />
      ) : (
        <Input value={value} isReadOnly bg="white" borderRadius="xl" />
      )}
    </Box>
  );
}

export default function MemberCustomFormView({
  form,
}: {
  form: MemberCustomFormDetailResponse;
}) {
  const fallbackLayoutColumn = normalizeLayoutColumn(form.formLayoutColumn);

  return (
    <Box mt={4}>
      <Box {...profileSectionCardStyles}>
        <Text {...profileSectionTitleStyles} mb={1}>
          {form.formHeaderText}
        </Text>
        <Text {...profileSectionDescriptionStyles} mb={4}>
          {form.formDescription ?? 'No description provided.'}
        </Text>

        <SimpleGrid columns={1} spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{
              base: 'repeat(1, minmax(0, 1fr))',
              md: 'repeat(12, minmax(0, 1fr))',
            }}
            gap={3}
          >
            {form.fields
              .slice()
              .sort((a, b) => a.fieldDisplayOrder - b.fieldDisplayOrder)
              .map((field) => (
                <FieldCard
                  key={field.fieldUniqueId}
                  field={field}
                  fallbackLayoutColumn={fallbackLayoutColumn}
                />
              ))}
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
