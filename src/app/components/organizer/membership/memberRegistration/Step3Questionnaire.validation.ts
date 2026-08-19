import CommonMethod from 'app/service/helpers/commonMethod';
import {
  RegistrationCustomQuestion,
  RegistrationFormField,
} from '../types';

const DEFAULT_NUMBER_MAX_LENGTH = 15;
const DEFAULT_PHONE_MAX_LENGTH = 15;
const DEFAULT_EMAIL_MAX_LENGTH = 254;

function toPositiveInt(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.trunc(parsed);
}

function getTextValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getTrimmedText(value: unknown) {
  return getTextValue(value).trim();
}

function isTruthyCheckboxValue(value: unknown) {
  return value === true || value === 'true' || value === '1';
}

function isEmptyValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof File) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value === false;
  }

  return getTrimmedText(value).length === 0;
}

function truncateDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function sanitizePhoneValue(value: string, maxLength = DEFAULT_PHONE_MAX_LENGTH) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '').slice(0, maxLength);
  return hasLeadingPlus ? `+${digits}` : digits;
}

function sanitizeTextValue(value: string, maxLength?: number | null) {
  if (typeof maxLength === 'number' && maxLength >= 0) {
    return value.slice(0, maxLength);
  }

  return value;
}

function validateLength(
  value: string,
  label: string,
  minLength?: number | null,
  maxLength?: number | null,
  unit = 'characters',
) {
  const trimmed = value.trim();
  const min = toPositiveInt(minLength);
  const max = toPositiveInt(maxLength);

  if (min !== null && trimmed.length < min) {
    return `${label} must be at least ${min} ${unit}`;
  }

  if (max !== null && trimmed.length > max) {
    return `${label} cannot exceed ${max} ${unit}`;
  }

  return '';
}

function validateDigitsOnly(
  value: string,
  label: string,
  minLength?: number | null,
  maxLength?: number | null,
  unit = 'digits',
) {
  const trimmed = value.trim();

  if (trimmed && !/^\d+$/.test(trimmed)) {
    return `${label} can contain numbers only`;
  }

  const min = toPositiveInt(minLength);
  const max = toPositiveInt(maxLength) ?? DEFAULT_NUMBER_MAX_LENGTH;

  if (min !== null && trimmed.length < min) {
    return `${label} must be at least ${min} ${unit}`;
  }

  if (trimmed.length > max) {
    return `${label} cannot exceed ${max} ${unit}`;
  }

  return '';
}

function validatePhoneValue(
  value: string,
  label: string,
  minLength?: number | null,
  maxLength?: number | null,
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (!/^\+?\d+$/.test(trimmed)) {
    return `${label} can contain numbers only`;
  }

  const min = toPositiveInt(minLength);
  const max = toPositiveInt(maxLength) ?? DEFAULT_PHONE_MAX_LENGTH;
  const normalizedLength = trimmed.replace(/^\+/, '').length;

  if (min !== null && normalizedLength < min) {
    return `${label} must be at least ${min} digits`;
  }

  if (normalizedLength > max) {
    return `${label} cannot exceed ${max} digits`;
  }

  return '';
}

function isLikelyNumericLabel(label: string) {
  return /\b(number|no\.?|qty|quantity|amount|count|digit|digits)\b/i.test(label);
}

function isLikelyPhoneLabel(label: string) {
  return /\b(phone|cell|mobile|telephone|tel)\b/i.test(label);
}

function isLikelyEmailLabel(label: string) {
  return /\b(email|e-mail)\b/i.test(label);
}

function validateRequiredValue(label: string, value: unknown, message?: string | null) {
  if (!isEmptyValue(value)) {
    return '';
  }

  return message?.trim() || `${label} is required.`;
}

function validateFormFieldValue(field: RegistrationFormField, rawValue: unknown) {
  const label = field.controlLabel?.trim() || 'Field';
  const textValue = getTextValue(rawValue);
  const minLength = field.minLength ?? null;
  const maxLength = field.maxLength ?? null;

  const isEmpty = isEmptyValue(rawValue);

  if (field.isMandatory) {
    const requiredError = validateRequiredValue(label, rawValue, field.requiredMessage);
    if (requiredError) {
      return requiredError;
    }
  } else if (isEmpty) {
    return '';
  }

  switch (field.formControlTypeId) {
    case 1:
      return validateLength(textValue, label, minLength, maxLength);
    case 2:
      if (textValue.trim() && !CommonMethod.EmailValidation(textValue.trim())) {
        return `${label} must be a valid email address`;
      }
      return validateLength(textValue, label, minLength, maxLength ?? DEFAULT_EMAIL_MAX_LENGTH);
    case 3:
      return validateDigitsOnly(textValue, label, minLength, maxLength ?? DEFAULT_NUMBER_MAX_LENGTH);
    case 4:
      return '';
    case 5:
      return '';
    case 6:
      return '';
    case 7:
      return '';
    case 8:
      return validateLength(textValue, label, minLength, maxLength);
    case 9:
      return '';
    case 10:
      return validateLength(textValue, label, minLength, maxLength);
    case 14:
      return validatePhoneValue(textValue, label, minLength, maxLength);
    case 15:
      return '';
    case 16:
    case 17:
      return '';
    default:
      if (isLikelyNumericLabel(label)) {
        return validateDigitsOnly(textValue, label, minLength, maxLength ?? DEFAULT_NUMBER_MAX_LENGTH);
      }

      if (isLikelyPhoneLabel(label)) {
        return validatePhoneValue(textValue, label, minLength, maxLength);
      }

      if (isLikelyEmailLabel(label)) {
        if (textValue.trim() && !CommonMethod.EmailValidation(textValue.trim())) {
          return `${label} must be a valid email address`;
        }
        return validateLength(textValue, label, minLength, maxLength ?? DEFAULT_EMAIL_MAX_LENGTH);
      }

      return validateLength(textValue, label, minLength, maxLength);
  }
}

function sanitizeFormFieldValue(field: RegistrationFormField, rawValue: unknown) {
  if (field.formControlTypeId === 6) {
    return isTruthyCheckboxValue(rawValue);
  }

  if (field.formControlTypeId === 15) {
    return Array.isArray(rawValue) ? rawValue : [];
  }

  if (field.formControlTypeId === 9) {
    return rawValue instanceof File ? rawValue : null;
  }

  const textValue = getTextValue(rawValue);

  if (field.formControlTypeId === 3) {
    return truncateDigits(textValue, toPositiveInt(field.maxLength) ?? DEFAULT_NUMBER_MAX_LENGTH);
  }

  if (field.formControlTypeId === 14) {
    return sanitizePhoneValue(textValue, toPositiveInt(field.maxLength) ?? DEFAULT_PHONE_MAX_LENGTH);
  }

  if (isLikelyNumericLabel(field.controlLabel)) {
    return truncateDigits(textValue, toPositiveInt(field.maxLength) ?? DEFAULT_NUMBER_MAX_LENGTH);
  }

  if (isLikelyPhoneLabel(field.controlLabel)) {
    return sanitizePhoneValue(textValue, toPositiveInt(field.maxLength) ?? DEFAULT_PHONE_MAX_LENGTH);
  }

  return sanitizeTextValue(textValue, field.maxLength);
}

function validateQuestionValue(question: RegistrationCustomQuestion, rawValue: unknown) {
  const label = question.label?.trim() || 'Question';
  const textValue = getTextValue(rawValue);
  const minLength = toPositiveInt(question.minLength);
  const maxLength = toPositiveInt(question.maxLength);
  const questionType = question.controlType.toLowerCase();

  const isEmpty = isEmptyValue(rawValue);

  if (question.required) {
    const requiredError = validateRequiredValue(label, rawValue, question.requiredMessage);
    if (requiredError) {
      return requiredError;
    }
  } else if (isEmpty) {
    return '';
  }

  switch (questionType) {
    case 'email':
      if (textValue.trim() && !CommonMethod.EmailValidation(textValue.trim())) {
        return `${label} must be a valid email address`;
      }
      return validateLength(textValue, label, minLength, maxLength ?? DEFAULT_EMAIL_MAX_LENGTH);
    case 'phone':
      return validatePhoneValue(textValue, label, minLength, maxLength);
    case 'number':
      return validateDigitsOnly(textValue, label, minLength, maxLength ?? DEFAULT_NUMBER_MAX_LENGTH);
    case 'textarea':
    case 'text':
    default:
      if (isLikelyNumericLabel(label) || questionType === 'number') {
        return validateDigitsOnly(textValue, label, minLength, maxLength ?? DEFAULT_NUMBER_MAX_LENGTH);
      }

      if (isLikelyPhoneLabel(label)) {
        return validatePhoneValue(textValue, label, minLength, maxLength);
      }

      if (isLikelyEmailLabel(label)) {
        if (textValue.trim() && !CommonMethod.EmailValidation(textValue.trim())) {
          return `${label} must be a valid email address`;
        }
        return validateLength(textValue, label, minLength, maxLength ?? DEFAULT_EMAIL_MAX_LENGTH);
      }

      return validateLength(textValue, label, minLength, maxLength);
  }
}

function sanitizeQuestionValue(question: RegistrationCustomQuestion, rawValue: unknown) {
  const questionType = question.controlType.toLowerCase();

  if (questionType === 'checkbox') {
    return rawValue === true;
  }

  const textValue = getTextValue(rawValue);

  if (questionType === 'phone') {
    return sanitizePhoneValue(textValue, toPositiveInt(question.maxLength) ?? DEFAULT_PHONE_MAX_LENGTH);
  }

  if (questionType === 'number' || isLikelyNumericLabel(question.label)) {
    return truncateDigits(textValue, toPositiveInt(question.maxLength) ?? DEFAULT_NUMBER_MAX_LENGTH);
  }

  return sanitizeTextValue(textValue, toPositiveInt(question.maxLength));
}

export function getQuestionnaireGridSpan(layoutColumn: number | null | undefined) {
  const normalized = typeof layoutColumn === 'number' && Number.isFinite(layoutColumn)
    ? Math.max(1, Math.min(4, Math.trunc(layoutColumn)))
    : 1;

  switch (normalized) {
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

export function validateFormFields(fields: RegistrationFormField[], values: Record<string, unknown>) {
  return fields.reduce<Record<string, string>>((accumulator, field) => {
    const error = validateFormFieldValue(field, values[field.uniqueId]);
    if (error) {
      accumulator[field.uniqueId] = error;
    }
    return accumulator;
  }, {});
}

export function validateFormField(field: RegistrationFormField, value: unknown) {
  return validateFormFieldValue(field, value);
}

export function validateQuestions(
  questions: RegistrationCustomQuestion[],
  values: Record<string, unknown>,
) {
  return questions.reduce<Record<string, string>>((accumulator, question) => {
    const error = validateQuestionValue(question, values[question.uniqueId]);
    if (error) {
      accumulator[question.uniqueId] = error;
    }
    return accumulator;
  }, {});
}

export function validateQuestion(question: RegistrationCustomQuestion, value: unknown) {
  return validateQuestionValue(question, value);
}

export function sanitizeFormField(field: RegistrationFormField, value: unknown) {
  return sanitizeFormFieldValue(field, value);
}

export function sanitizeQuestion(question: RegistrationCustomQuestion, value: unknown) {
  return sanitizeQuestionValue(question, value);
}

export function getFormFieldInputProps(field: RegistrationFormField) {
  const maxLength = toPositiveInt(field.maxLength);
  const label = field.controlLabel || '';

  switch (field.formControlTypeId) {
    case 2:
      return { type: 'email', maxLength: maxLength ?? DEFAULT_EMAIL_MAX_LENGTH };
    case 3:
      return { inputMode: 'numeric' as const, maxLength: maxLength ?? DEFAULT_NUMBER_MAX_LENGTH };
    case 4:
      return { type: 'date' };
    case 8:
      return { maxLength: maxLength ?? undefined };
    case 9:
      return {};
    case 10:
      return { type: 'password', maxLength: maxLength ?? undefined };
    case 14:
      return { type: 'tel', inputMode: 'tel' as const, maxLength: maxLength ?? (DEFAULT_PHONE_MAX_LENGTH + 1) };
    default:
      if (isLikelyNumericLabel(label)) {
        return { inputMode: 'numeric' as const, maxLength: maxLength ?? DEFAULT_NUMBER_MAX_LENGTH };
      }

      if (isLikelyPhoneLabel(label)) {
        return { type: 'tel', inputMode: 'tel' as const, maxLength: maxLength ?? (DEFAULT_PHONE_MAX_LENGTH + 1) };
      }

      if (isLikelyEmailLabel(label)) {
        return { type: 'email', maxLength: maxLength ?? DEFAULT_EMAIL_MAX_LENGTH };
      }

      return { maxLength: maxLength ?? undefined };
  }
}

export function getQuestionInputProps(question: RegistrationCustomQuestion) {
  const maxLength = toPositiveInt(question.maxLength);
  const controlType = question.controlType.toLowerCase();

  switch (controlType) {
    case 'email':
      return { type: 'email', maxLength: maxLength ?? DEFAULT_EMAIL_MAX_LENGTH };
    case 'phone':
      return { type: 'tel', inputMode: 'tel' as const, maxLength: maxLength ?? (DEFAULT_PHONE_MAX_LENGTH + 1) };
    case 'number':
      return { inputMode: 'numeric' as const, maxLength: maxLength ?? DEFAULT_NUMBER_MAX_LENGTH };
    case 'date':
      return { type: 'date' };
    case 'textarea':
      return { maxLength: maxLength ?? undefined };
    default:
      return { maxLength: maxLength ?? undefined };
  }
}
