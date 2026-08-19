import React, { useEffect, useState } from 'react';
import { Box, Flex, Grid, Text, useToast } from '@chakra-ui/react';
import {
  RegistrationCustomForm,
  RegistrationCustomQuestion,
} from '../types';
import memberRegistrationService from '../services/memberRegistrationService';
import RegistrationFooter from './RegistrationFooter';
import {
  DynamicFormField,
  DynamicQuestionField,
} from './Step3QuestionnaireFields';
import {
  getQuestionnaireGridSpan,
  sanitizeFormField,
  sanitizeQuestion,
  validateFormField,
  validateQuestion,
} from './Step3Questionnaire.validation';

export type QuestionnaireValues = Record<string, any>;

interface Props {
  customForms: RegistrationCustomForm[];
  customQuestions: RegistrationCustomQuestion[];
  initialValues?: QuestionnaireValues;
  onBack: () => void;
  onContinue: (values: QuestionnaireValues) => void;
  themeColor?: string;
}

function buildInitialValues(
  customForms: RegistrationCustomForm[],
  customQuestions: RegistrationCustomQuestion[],
  initialValues?: QuestionnaireValues,
) {
  if (initialValues && Object.keys(initialValues).length > 0) {
    return initialValues;
  }

  const next: QuestionnaireValues = {};

  customForms.forEach((form) => {
    form.fields.forEach((field) => {
      if (field.defaultValue === null || field.defaultValue === undefined || field.defaultValue === '') {
        return;
      }

      if (field.formControlTypeId === 15) {
        next[field.uniqueId] = field.defaultValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        return;
      }

      if (field.formControlTypeId === 6) {
        next[field.uniqueId] = field.defaultValue === 'true' || field.defaultValue === '1';
        return;
      }

      if (field.formControlTypeId === 9) {
        next[field.uniqueId] = null;
        return;
      }

      next[field.uniqueId] = field.defaultValue;
    });
  });

  customQuestions.forEach((question) => {
    if (question.defaultValue === null || question.defaultValue === undefined || question.defaultValue === '') {
      return;
    }

    if (question.controlType.toLowerCase() === 'checkbox') {
      next[question.uniqueId] = question.defaultValue === 'true' || question.defaultValue === '1';
      return;
    }

    if (question.controlType.toLowerCase() === 'multiselect') {
      next[question.uniqueId] = question.defaultValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return;
    }

    next[question.uniqueId] = question.defaultValue;
  });

  return next;
}

export default function Step3Questionnaire({
  customForms,
  customQuestions,
  initialValues,
  onBack,
  onContinue,
  themeColor = '#044bd9',
}: Props) {
  const toast = useToast();
  const [values, setValues] = useState<QuestionnaireValues>(() =>
    buildInitialValues(customForms, customQuestions, initialValues),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<{ countryId: number; name: string }[]>([]);
  const [stateOptions, setStateOptions] = useState<{ stateId: number; name: string }[]>([]);

  useEffect(() => {
    memberRegistrationService
      .getCountryList()
      .then((response) => setCountries(response.data?.data ?? []))
      .catch(() => {});
  }, []);

  const countryFieldUniqueId = customForms
    .flatMap((form) => form.fields)
    .find((field) => field.formControlTypeId === 16)?.uniqueId;
  const countryValue = countryFieldUniqueId ? values[countryFieldUniqueId] : undefined;

  useEffect(() => {
    if (!countryValue) {
      setStateOptions([]);
      return;
    }

    memberRegistrationService
      .getStatesByCountry(Number(countryValue))
      .then((response) => setStateOptions(response.data?.data?.[0]?.states ?? []))
      .catch(() => setStateOptions([]));
  }, [countryValue]);

  const setValue = (key: string, nextValue: any) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const updateFieldError = (key: string, error: string) => {
    setErrors((prev) => {
      if (!error) {
        const next = { ...prev };
        delete next[key];
        return next;
      }

      return { ...prev, [key]: error };
    });
  };

  const hasContent = customForms.length > 0 || customQuestions.length > 0;

  const handleContinue = () => {
    const nextErrors: Record<string, string> = {};

    customForms.forEach((form) => {
      form.fields.forEach((field) => {
        const error = validateFormField(field, values[field.uniqueId]);
        if (error) {
          nextErrors[field.uniqueId] = error;
        }
      });
    });

    customQuestions.forEach((question) => {
      const error = validateQuestion(question, values[question.uniqueId]);
      if (error) {
        nextErrors[question.uniqueId] = error;
      }
    });

    setErrors(nextErrors);

    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      toast({
        title: firstError,
        status: 'error',
        position: 'top-right',
      });
      return;
    }

    onContinue(values);
  };

  return (
    <Box flex={1} display="flex" flexDirection="column" minH={0}>
      <Box flex={1} overflowY="auto" px={{ base: 4, md: 8 }} py={6} bg="gray.50">
        {!hasContent ? (
          <Flex align="center" justify="center" py={20}>
            <Text fontSize="sm" color="gray.400">
              No questions configured for this membership.
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" gap={4}>
            {customForms.map((form) => (
              <Box
                key={form.uniqueId}
                bg="white"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
                p={5}
                boxShadow="sm"
              >
                <Text fontSize="md" fontWeight="bold" color="gray.900" mb={0.5}>
                  {form.headerText || form.name}
                </Text>
                {form.description ? (
                  <Text fontSize="xs" color="gray.500" mb={4}>
                    {form.description}
                  </Text>
                ) : null}
                <Grid
                  templateColumns={{ base: '1fr', sm: 'repeat(12, minmax(0, 1fr))' }}
                  gap={3}
                >
                  {[...form.fields]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((field) => {
                      const span = getQuestionnaireGridSpan(field.layoutColumn ?? form.layoutColumn);
                      const gridColumn = {
                        base: '1 / -1',
                        sm: `span ${span} / span ${span}`,
                      };

                      return (
                        <DynamicFormField
                          key={field.uniqueId}
                          field={field}
                          value={values[field.uniqueId]}
                          error={errors[field.uniqueId]}
                          gridColumn={gridColumn}
                          countries={countries}
                          stateOptions={stateOptions}
                          onChange={(next) => {
                            const sanitized = sanitizeFormField(field, next);
                            setValue(field.uniqueId, sanitized);
                            updateFieldError(field.uniqueId, validateFormField(field, sanitized));
                          }}
                        />
                      );
                    })}
                </Grid>
              </Box>
            ))}

            {customQuestions.length > 0 ? (
              <Box
                bg="white"
                borderRadius="xl"
                border="1px solid"
                borderColor="gray.200"
                p={5}
                boxShadow="sm"
              >
                <Text fontSize="md" fontWeight="bold" color="gray.900" mb={0.5}>
                  Additional Questions
                </Text>
                <Text fontSize="xs" color="gray.500" mb={4}>
                  Please answer the following questions.
                </Text>
                <Grid templateColumns="1fr" gap={3}>
                  {[...customQuestions]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((question) => (
                      <DynamicQuestionField
                        key={question.uniqueId}
                        question={question}
                        value={values[question.uniqueId]}
                        error={errors[question.uniqueId]}
                        onChange={(next) => {
                          const sanitized = sanitizeQuestion(question, next);
                          setValue(question.uniqueId, sanitized);
                          updateFieldError(question.uniqueId, validateQuestion(question, sanitized));
                        }}
                      />
                    ))}
                </Grid>
              </Box>
            ) : null}
          </Flex>
        )}
      </Box>

      <RegistrationFooter onBack={onBack} onContinue={handleContinue} color={themeColor} />
    </Box>
  );
}
