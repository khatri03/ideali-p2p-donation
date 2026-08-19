import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Stack,
  Text,
  Textarea,
  Input,
} from '@chakra-ui/react';
import {
  getDefaultMultiSelectValues,
  getDefaultOptionValue,
  getPreviewColumnSpan,
  isTruthyValue,
  mapPreviewFieldToDraft,
} from '../../../customForm/custom-form-bundle/customForm/helpers/CustomFormCreatePage.helpers';
import { fetchCustomFormPreview } from '../../../customForm/custom-form-bundle/customForm/services/customForms';
import type { CustomFormFieldDraft } from '../../../customForm/custom-form-bundle/customForm/types/customForms';

function PreviewFieldLabel({ field }: { field: CustomFormFieldDraft }) {
  if (field.controlType.toLowerCase() === 'checkbox') {
    return null;
  }

  return (
    <Flex align="center" gap={2} mb={2}>
      <Text fontSize="sm" fontWeight="semibold" color="gray.800">
        {field.label}
      </Text>
      {field.required ? (
        <Badge colorScheme="red" variant="subtle" borderRadius="full" fontSize="9px">
          Required
        </Badge>
      ) : null}
    </Flex>
  );
}

function PreviewFieldRenderer({
  field,
  value,
}: {
  field: CustomFormFieldDraft;
  value: string | string[] | boolean | null;
}) {
  const controlType = field.controlType.toLowerCase();
  const defaultOptionValue = getDefaultOptionValue(field);
  const multiSelectValue = Array.isArray(value) ? value : getDefaultMultiSelectValues(field);

  const inputStyle = {
    bg: 'white',
    borderColor: 'blue.100',
    borderRadius: 'xl',
    fontSize: 'sm' as const,
    boxShadow: 'sm',
    _hover: {
      borderColor: 'blue.200',
    },
    _focus: {
      borderColor: 'blue.300',
      boxShadow: '0 0 0 1px #4299e11a, 0 0 0 4px #ebf8ff',
      bg: 'white',
    },
  };

  switch (controlType) {
    case 'text':
    case 'email':
    case 'number':
    case 'date':
    case 'tel':
      return (
        <Input
          type={controlType}
          value={typeof value === 'string' ? value : ''}
          isReadOnly
          placeholder={field.placeholder || field.label}
          {...inputStyle}
        />
      );
    case 'password':
      return (
        <Input
          type="password"
          value={typeof value === 'string' ? value : ''}
          isReadOnly
          placeholder={field.placeholder || field.label}
          {...inputStyle}
        />
      );
    case 'textarea':
      return (
        <Textarea
          rows={4}
          value={typeof value === 'string' ? value : ''}
          isReadOnly
          placeholder={field.placeholder || field.label}
          resize="none"
          {...inputStyle}
        />
      );
    case 'select':
      return (
        <Select
          value={typeof value === 'string' ? value : ''}
          isDisabled
          placeholder={field.placeholder || 'Select one'}
          {...inputStyle}
        >
          {field.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.displayText}
            </option>
          ))}
        </Select>
      );
    case 'radio':
      return (
        <RadioGroup
          value={typeof value === 'string' ? value : defaultOptionValue}
          isDisabled
        >
          <Stack spacing={3}>
            {field.options.map((option) => (
              <Radio key={option.id} value={option.value} colorScheme="blue" size="sm">
                <Text fontSize="sm" color="gray.700">
                  {option.displayText}
                </Text>
              </Radio>
            ))}
          </Stack>
        </RadioGroup>
      );
    case 'checkbox':
      return (
        <Checkbox
          size="sm"
          colorScheme="blue"
          isChecked={typeof value === 'boolean' ? value : isTruthyValue(field.defaultValue)}
          isDisabled
        >
          <Text fontSize="sm" color="gray.700">
            {field.label}
          </Text>
        </Checkbox>
      );
    case 'file':
      return (
        <Input
          type="file"
          accept={field.acceptedFileTypes.length > 0 ? field.acceptedFileTypes.join(',') : undefined}
          isDisabled
          variant="unstyled"
          pt={1}
          fontSize="sm"
          color="gray.500"
        />
      );
    case 'multiselect':
      return (
        <Box>
          <Select
            value={Array.isArray(value) ? (value[0] ?? '') : ''}
            isDisabled
            placeholder={field.placeholder || 'Select one or more'}
            {...inputStyle}
          >
            {field.options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.displayText}
              </option>
            ))}
          </Select>
          {multiSelectValue.length > 0 && (
            <Flex flexWrap="wrap" gap={2} mt={3}>
              {multiSelectValue.map((item) => {
                const opt = field.options.find((o) => o.value === item);
                return (
                  <Badge
                    key={item}
                    colorScheme="blue"
                    variant="subtle"
                    borderRadius="full"
                    px={2}
                    py={1}
                  >
                    {opt?.displayText ?? item}
                  </Badge>
                );
              })}
            </Flex>
          )}
        </Box>
      );
    default:
      return (
        <Input
          type="text"
          value={typeof value === 'string' ? value : ''}
          isReadOnly
          placeholder={field.placeholder || field.label}
          {...inputStyle}
        />
      );
  }
}

function PreviewFieldCard({
  field,
  span,
  isCompactViewport,
  value,
}: {
  field: CustomFormFieldDraft;
  span: number;
  isCompactViewport: boolean;
  value: string | string[] | boolean | null;
}) {
  return (
    <Box
      h="full"
      border="1px solid"
      borderColor="blue.50"
      bg="white"
      borderRadius="3xl"
      p={4}
      gridColumn={isCompactViewport ? '1 / -1' : `span ${span} / span ${span}`}
    >
      <PreviewFieldLabel field={field} />
      <PreviewFieldRenderer field={field} value={value} />
      {field.tooltip ? (
        <Text mt={2} fontSize="xs" color="gray.500" lineHeight="tall">
          {field.tooltip}
        </Text>
      ) : null}
    </Box>
  );
}

function PreviewFormCanvas({
  fields,
  spanCount,
  isCompactViewport,
}: {
  fields: CustomFormFieldDraft[];
  spanCount: number;
  isCompactViewport: boolean;
}) {
  const [previewValues, setPreviewValues] = useState<Record<string, string | string[] | boolean | null>>({});

  useEffect(() => {
    const nextValues: Record<string, string | string[] | boolean | null> = {};
    fields.forEach((field) => {
      const controlType = field.controlType.toLowerCase();
      if (controlType === 'checkbox') nextValues[field.id] = isTruthyValue(field.defaultValue);
      else if (controlType === 'radio' || controlType === 'select') nextValues[field.id] = getDefaultOptionValue(field);
      else if (controlType === 'multiselect') nextValues[field.id] = getDefaultMultiSelectValues(field);
      else if (controlType === 'file') nextValues[field.id] = null;
      else nextValues[field.id] = field.defaultValue || '';
    });
    setPreviewValues(nextValues);
  }, [fields]);

  return (
    <Box display="grid" gridTemplateColumns={{ base: '1fr', sm: 'repeat(12, minmax(0, 1fr))' }} gap={5}>
      {fields.map((field) => (
        <Box
          key={field.id}
          h="full"
          gridColumn={{
            base: '1 / -1',
            sm: `span ${getPreviewColumnSpan(field, spanCount)} / span ${getPreviewColumnSpan(field, spanCount)}`,
          }}
        >
          <PreviewFieldCard
            field={field}
            span={getPreviewColumnSpan(field, spanCount)}
            isCompactViewport={isCompactViewport}
            value={previewValues[field.id] ?? ''}
          />
        </Box>
      ))}
    </Box>
  );
}

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formUniqueId: string | null;
}

export default function FormPreviewModal({ isOpen, onClose, formUniqueId }: FormPreviewModalProps) {
  const [formName, setFormName] = useState('Custom Form');
  const [headerText, setHeaderText] = useState('Custom Form');
  const [description, setDescription] = useState<string | null>(null);
  const [previewFields, setPreviewFields] = useState<CustomFormFieldDraft[]>([]);
  const [previewColumnCount, setPreviewColumnCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !formUniqueId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetchCustomFormPreview(formUniqueId)
      .then((preview) => {
        if (cancelled) {
          return;
        }

        setFormName(preview.name || 'Custom Form');
        setHeaderText(preview.headerText || preview.name || 'Custom Form');
        setDescription(preview.description ?? null);
        setPreviewColumnCount(Math.max(1, Math.min(4, preview.layoutColumn ?? 2)));
        setPreviewFields(preview.fields.map((field) => mapPreviewFieldToDraft(field)).sort((a, b) => a.displayOrder - b.displayOrder));
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load custom form preview.');
          setPreviewFields([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, formUniqueId]);

  const hasFields = useMemo(() => previewFields.length > 0, [previewFields]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent borderRadius="2xl" overflow="hidden" mx={4}>
        <ModalHeader pb={4}>
          <Box>
            <Text fontSize="xs" fontWeight="bold" color="gray.900" textTransform="uppercase" letterSpacing="widest" mb={1}>
              Preview
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900">
              {headerText}
            </Text>
            {description ? (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {description}
              </Text>
            ) : null}
            <Text fontSize="xs" color="gray.400" mt={1}>
              {formName}
            </Text>
          </Box>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody px={8} py={6}>
          {isLoading ? (
            <Flex justify="center" align="center" py={12}>
              <Spinner color="blue.400" size="lg" />
            </Flex>
          ) : loadError ? (
            <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="2xl" p={6}>
              <Text fontSize="sm" fontWeight="semibold" color="red.700">
                Preview failed
              </Text>
              <Text fontSize="sm" color="red.600" mt={1}>
                {loadError}
              </Text>
            </Box>
          ) : hasFields ? (
            <Box bg="blue.50" border="1px solid" borderColor="blue.50" borderRadius="xl" p={4}>
              <PreviewFormCanvas
                fields={previewFields}
                spanCount={previewColumnCount}
                isCompactViewport={false}
              />
            </Box>
          ) : (
            <Box bg="blue.50" border="1px solid" borderColor="blue.50" borderRadius="xl" p={4}>
              <Text fontSize="sm" color="gray.500">
                Add fields to preview the form.
              </Text>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="blue.50" bg="white">
          <Button onClick={onClose} variant="ghost" colorScheme="blue">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
