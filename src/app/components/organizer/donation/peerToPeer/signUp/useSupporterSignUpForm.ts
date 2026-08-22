import { useState } from 'react';
import { SupporterSignUpRequest } from 'app/interface/donationInter/supporterSignUpDto';
import CommonMethod from 'app/service/helpers/commonMethod';
import {
  CONFIRM_PASSWORD_MISMATCH,
  EMAIL_INVALID,
  EMAIL_MAX_LENGTH,
  EMAIL_REQUIRED,
  EMAIL_TOO_LONG,
  FIRST_NAME_REQUIRED,
  LAST_NAME_REQUIRED,
  NAME_MAX_LENGTH,
  NAME_TOO_LONG,
  PASSWORD_INVALID,
} from './signUpCopy';

export interface SupporterSignUpValues {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  confirmPassword: string;
}

export type SupporterSignUpErrors = Partial<Record<keyof SupporterSignUpValues, string>>;

export interface SupporterSignUpFormState {
  values: SupporterSignUpValues;
  errors: SupporterSignUpErrors;
  setValue: (field: keyof SupporterSignUpValues, value: string) => void;
  validate: () => boolean;
  buildRequest: () => SupporterSignUpRequest;
}

const EMPTY_VALUES: SupporterSignUpValues = {
  firstName: '',
  lastName: '',
  emailAddress: '',
  password: '',
  confirmPassword: '',
};

const nameError = (value: string, missing: string): string | undefined => {
  const trimmed = value.trim();

  if (trimmed === '') {
    return missing;
  }

  return trimmed.length > NAME_MAX_LENGTH ? NAME_TOO_LONG : undefined;
};

const emailError = (value: string): string | undefined => {
  const trimmed = value.trim();

  if (trimmed === '') {
    return EMAIL_REQUIRED;
  }

  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return EMAIL_TOO_LONG;
  }

  return CommonMethod.EmailValidation(trimmed) ? undefined : EMAIL_INVALID;
};

/**
 * Holds what a supporter types and the rules that reject it. The same rules run on the server; these
 * exist so a field explains itself before a round trip, never as the only check.
 */
export function useSupporterSignUpForm(): SupporterSignUpFormState {
  const [values, setValues] = useState<SupporterSignUpValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<SupporterSignUpErrors>({});

  const setValue = (field: keyof SupporterSignUpValues, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const validate = (): boolean => {
    const found: SupporterSignUpErrors = {
      firstName: nameError(values.firstName, FIRST_NAME_REQUIRED),
      lastName: nameError(values.lastName, LAST_NAME_REQUIRED),
      emailAddress: emailError(values.emailAddress),
      password: CommonMethod.PasswordValidation(values.password) ? undefined : PASSWORD_INVALID,
      confirmPassword:
        values.confirmPassword === values.password ? undefined : CONFIRM_PASSWORD_MISMATCH,
    };

    const failures = Object.fromEntries(
      Object.entries(found).filter(([, message]) => Boolean(message)),
    ) as SupporterSignUpErrors;

    setErrors(failures);

    return Object.keys(failures).length === 0;
  };

  const buildRequest = (): SupporterSignUpRequest => ({
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    emailAddress: values.emailAddress.trim(),
    password: values.password,
  });

  return { values, errors, setValue, validate, buildRequest };
}
