import { useState } from 'react';
import HttpClient from 'app/service/httpClient/HttpClient';
import CommonMethod from 'app/service/helpers/commonMethod';
import {
  LoginResponse,
  completeLogin,
  completeTwoFactorLogin,
} from 'app/components/auth/completeLogin';
import signUpService from 'app/service/auth/signUpService';
import {
  SIGN_IN_EMAIL_INVALID,
  SIGN_IN_EMAIL_REQUIRED,
  SIGN_IN_PASSWORD_REQUIRED,
  SIGN_IN_REFUSED,
} from './accessCopy';

export interface SupporterSignInValues {
  emailAddress: string;
  password: string;
}

export type SupporterSignInErrors = Partial<Record<keyof SupporterSignInValues, string>>;

export interface SupporterSignInState {
  values: SupporterSignInValues;
  errors: SupporterSignInErrors;
  submitError: string | null;
  isSubmitting: boolean;
  /** Set while the account's second factor is outstanding, so the caller can show the code prompt. */
  twoFactorToken: string | null;
  setValue: (field: keyof SupporterSignInValues, value: string) => void;
  submit: () => Promise<void>;
  verifyTwoFactorCode: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
}

const AUTHENTICATE_URL = '/api/identity/account/authenticate';

/**
 * Signing in from inside the fundraising flow.
 *
 * The session itself is established by the shared `completeLogin`, second factor included, so this
 * surface cannot become a way around a check the sign-in screen performs. What lives here is only
 * the form: what was typed, what was rejected, and what is in flight.
 */
export function useSupporterSignIn(returnPath: string): SupporterSignInState {
  const [values, setValues] = useState<SupporterSignInValues>({ emailAddress: '', password: '' });
  const [errors, setErrors] = useState<SupporterSignInErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

  const setValue = (field: keyof SupporterSignInValues, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const validate = (): boolean => {
    const emailAddress = values.emailAddress.trim();
    const found: SupporterSignInErrors = {};

    if (emailAddress === '') {
      found.emailAddress = SIGN_IN_EMAIL_REQUIRED;
    } else if (!CommonMethod.EmailValidation(emailAddress)) {
      found.emailAddress = SIGN_IN_EMAIL_INVALID;
    }

    if (values.password === '') {
      found.password = SIGN_IN_PASSWORD_REQUIRED;
    }

    setErrors(found);

    return Object.keys(found).length === 0;
  };

  const submit = async (): Promise<void> => {
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const credentials = new FormData();
      credentials.append('userName', values.emailAddress.trim());
      credentials.append('password', values.password);

      const response = await HttpClient.post(AUTHENTICATE_URL, credentials, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const body = response?.data as LoginResponse & { data?: { twoFaToken?: string; requiresTwoFactor?: boolean } };

      if (!body?.success) {
        setSubmitError(SIGN_IN_REFUSED);
        return;
      }

      if (body.data?.requiresTwoFactor) {
        setTwoFactorToken(body.data.twoFaToken ?? '');
        return;
      }

      completeLogin(body, 'ideali', returnPath);
    } catch {
      // The server's own wording can distinguish an unknown address from a wrong password. One
      // sentence for both keeps this form from answering that question.
      setSubmitError(SIGN_IN_REFUSED);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyTwoFactorCode = async (code: string): Promise<void> => {
    const response = await signUpService.verify2FA(twoFactorToken ?? '', code);

    if (!response?.success) {
      throw new Error(response?.message ?? 'Invalid verification code. Please try again.');
    }

    completeTwoFactorLogin(response, returnPath);
  };

  const cancelTwoFactor = () => setTwoFactorToken(null);

  return {
    values,
    errors,
    submitError,
    isSubmitting,
    twoFactorToken,
    setValue,
    submit,
    verifyTwoFactorCode,
    cancelTwoFactor,
  };
}
