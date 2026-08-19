import React, { useRef } from 'react';
import {
  Box,
  Checkbox,
  Flex,
  Icon,
  Input,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Textarea,
  Tooltip,
} from '@chakra-ui/react';
import { MdCloudUpload, MdInfoOutline } from 'react-icons/md';
import {
  RegistrationCustomQuestion,
  RegistrationFormField,
} from '../types';
import {
  getFormFieldInputProps,
  getQuestionInputProps,
  sanitizeFormField,
  sanitizeQuestion,
} from './Step3Questionnaire.validation';

const inputBaseStyle = {
  bg: 'gray.50',
  borderColor: 'gray.200',
  borderRadius: 'lg',
  fontSize: 'sm' as const,
  size: 'sm' as const,
  _focus: { borderColor: '#044bd9', boxShadow: '0 0 0 1px #044bd9', bg: 'white' },
  _hover: { borderColor: 'gray.300' },
};

function getInputStyle(hasError: boolean) {
  return {
    ...inputBaseStyle,
    borderColor: hasError ? 'red.300' : inputBaseStyle.borderColor,
    _focus: hasError
      ? { borderColor: 'red.400', boxShadow: '0 0 0 1px #e53e3e', bg: 'white' }
      : inputBaseStyle._focus,
  };
}

function FieldCard({
  label,
  required,
  tooltip,
  error,
  children,
  gridColumn,
}: {
  label?: string;
  required?: boolean;
  tooltip?: string | null;
  error?: string;
  children: React.ReactNode;
  gridColumn?: any;
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={error ? 'red.200' : 'gray.200'}
      borderRadius="xl"
      p={3}
      gridColumn={gridColumn}
      boxShadow={error ? '0 0 0 1px rgba(229, 62, 62, 0.12)' : undefined}
    >
      {label ? (
        <Flex align="center" gap={1} mb={2}>
          <Text fontSize="xs" fontWeight="semibold" color="gray.600">
            {label}
          </Text>
          {required ? <Text as="span" color="red.500" fontSize="xs">*</Text> : null}
          {tooltip ? (
            <Tooltip label={tooltip} placement="top" hasArrow fontSize="xs">
              <Box display="inline-flex" cursor="help">
                <Icon as={MdInfoOutline} boxSize={3} color="gray.400" />
              </Box>
            </Tooltip>
          ) : null}
        </Flex>
      ) : null}
      {children}
      {error ? (
        <Text mt={2} fontSize="xs" color="red.500">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

function MultiSelectField({
  options,
  value,
  onChange,
}: {
  options: Array<{ id?: number; value: string; displayText: string }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((item) => item !== val));
      return;
    }

    onChange([...value, val]);
  };

  return (
    <Box>
      {value.length > 0 ? (
        <Flex flexWrap="wrap" gap={1} mb={2}>
          {value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Tag
                key={v}
                size="sm"
                borderRadius="full"
                bg="blue.50"
                color="#044bd9"
                border="1px solid"
                borderColor="blue.200"
              >
                <TagLabel fontSize="xs">{opt?.displayText ?? v}</TagLabel>
                <TagCloseButton onClick={() => toggle(v)} />
              </Tag>
            );
          })}
        </Flex>
      ) : null}
      <Flex gap={3} flexWrap="wrap">
        {options.map((o) => (
          <Checkbox
            key={o.value}
            isChecked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
            colorScheme="blue"
            size="sm"
          >
            <Text fontSize="sm">{o.displayText}</Text>
          </Checkbox>
        ))}
      </Flex>
    </Box>
  );
}

function FileUploadField({
  value,
  onChange,
}: {
  value: File | null;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Box
      border="2px dashed"
      borderColor={value ? 'blue.300' : 'blue.200'}
      borderRadius="lg"
      p={4}
      textAlign="center"
      cursor="pointer"
      bg={value ? 'blue.50' : 'white'}
      _hover={{ bg: 'blue.50', borderColor: 'blue.300' }}
      transition="all 0.15s"
      onClick={() => ref.current?.click()}
    >
      <Icon as={MdCloudUpload} boxSize={6} color="blue.300" mb={1} />
      <Text fontSize="sm" fontWeight="medium" color="gray.700">
        {value ? value.name : 'Drop a file here or browse'}
      </Text>
      {value ? null : (
        <Text fontSize="xs" color="gray.400" mt={0.5}>
          Drag and drop a file here, or click to choose one from your device.
        </Text>
      )}
      <input
        ref={ref}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </Box>
  );
}

function DynamicFormField({
  field,
  value,
  onChange,
  error,
  gridColumn,
  countries,
  stateOptions,
}: {
  field: RegistrationFormField;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  gridColumn?: any;
  countries: { countryId: number; name: string }[];
  stateOptions: { stateId: number; name: string }[];
}) {
  const inputProps = getFormFieldInputProps(field);

  const renderInput = () => {
    switch (field.formControlTypeId) {
      case 1:
      case 8:
      case 10:
        return (
          <Input
            placeholder={field.placeHolder}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeFormField(field, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 2:
        return (
          <Input
            type="email"
            placeholder={field.placeHolder}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeFormField(field, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 3:
        return (
          <Input
            type="text"
            inputMode="numeric"
            placeholder={field.placeHolder}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeFormField(field, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 4:
        return (
          <Input
            type="date"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 5:
        return (
          <Select
            placeholder="Select..."
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            {...inputProps}
            {...getInputStyle(!!error)}
          >
            {field.options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.displayText}
              </option>
            ))}
          </Select>
        );
      case 6:
        return (
          <Box>
            <Checkbox
              isChecked={value === true || value === 'true'}
              onChange={(e) => onChange(e.target.checked)}
              colorScheme="blue"
              size="sm"
            >
              <Text fontSize="sm" color="gray.700">
                {field.controlLabel}
              </Text>
            </Checkbox>
          </Box>
        );
      case 7:
        return (
          <RadioGroup
            value={value ?? ''}
            onChange={(nextValue) => onChange(nextValue)}
          >
            <Stack spacing={2}>
              {field.options.map((option) => (
                <Radio key={option.id} value={option.value} colorScheme="blue" size="sm">
                  <Text fontSize="sm">{option.displayText}</Text>
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        );
      case 9:
        return <FileUploadField value={value ?? null} onChange={onChange} />;
      case 14:
        return (
          <Input
            type="tel"
            placeholder={field.placeHolder}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeFormField(field, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 15:
        return (
          <MultiSelectField
            options={field.options}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        );
      case 16:
        return (
          <Select
            placeholder="Select country..."
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            {...inputProps}
            {...getInputStyle(!!error)}
          >
            {countries.map((country) => (
              <option key={country.countryId} value={String(country.countryId)}>
                {country.name}
              </option>
            ))}
          </Select>
        );
      case 17:
        return stateOptions.length > 0 ? (
          <Select
            placeholder="Select state..."
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            {...inputProps}
            {...getInputStyle(!!error)}
          >
            {stateOptions.map((state) => (
              <option key={state.stateId} value={String(state.stateId)}>
                {state.name}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            placeholder="State / Province"
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeFormField(field, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      default:
        return (
          <Input
            placeholder={field.placeHolder}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeFormField(field, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
    }
  };

  return (
    <FieldCard
      label={field.controlLabel}
      required={field.isMandatory}
      tooltip={field.tooltip}
      error={error}
      gridColumn={gridColumn}
    >
      {renderInput()}
    </FieldCard>
  );
}

function DynamicQuestionField({
  question,
  value,
  onChange,
  error,
}: {
  question: RegistrationCustomQuestion;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}) {
  const inputProps = getQuestionInputProps(question);

  const renderInput = () => {
    switch (question.controlType.toLowerCase()) {
      case 'select':
        return (
          <Select
            placeholder="Select..."
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            {...inputProps}
            {...getInputStyle(!!error)}
          >
            {question.options.map((option, index) => (
              <option key={option.uniqueId ?? option.id ?? index} value={option.value}>
                {option.displayText}
              </option>
            ))}
          </Select>
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            placeholder={question.placeHolder ?? ''}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeQuestion(question, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 'phone':
        return (
          <Input
            type="tel"
            placeholder={question.placeHolder ?? ''}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeQuestion(question, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            isChecked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            colorScheme="blue"
            size="sm"
          >
            <Text fontSize="sm">{question.label}</Text>
          </Checkbox>
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeHolder ?? ''}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeQuestion(question, e.target.value))}
            rows={3}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
      default:
        return (
          <Input
            placeholder={question.placeHolder ?? ''}
            value={value ?? ''}
            onChange={(e) => onChange(sanitizeQuestion(question, e.target.value))}
            {...inputProps}
            {...getInputStyle(!!error)}
          />
        );
    }
  };

  if (question.controlType === 'checkbox') {
    return (
      <FieldCard error={error} gridColumn="1 / -1">
        {renderInput()}
      </FieldCard>
    );
  }

  return (
    <FieldCard
      label={question.label}
      required={question.required}
      tooltip={question.tooltip}
      error={error}
      gridColumn="1 / -1"
    >
      {renderInput()}
    </FieldCard>
  );
}

export { DynamicFormField, DynamicQuestionField };
