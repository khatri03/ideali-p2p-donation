import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import CommonMethod from '../../../../service/helpers/commonMethod';
import memberRegistrationService from '../services/memberRegistrationService';
import { Step2Errors } from '../types';
import { Step2Data } from './Step2YourInformation';

interface Options {
  initialData?: Partial<Step2Data>;
  onContinue: (data: Step2Data) => void;
}

export function useStep2YourInformation({ initialData, onContinue }: Options) {
  const toast   = useToast();
  const photoRef = useRef<HTMLInputElement>(null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [errors,          setErrors]          = useState<Step2Errors>({});
  const [email,           setEmail]           = useState(initialData?.email ?? '');
  const [password,        setPassword]        = useState(initialData?.password ?? '');
  const [confirmPassword, setConfirmPassword] = useState(initialData?.confirmPassword ?? '');
  const [profilePhoto,    setProfilePhoto]    = useState<File | null>(initialData?.profilePhoto ?? null);
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(null);
  const [cropSrc,         setCropSrc]         = useState<string | null>(null);
  const [prefix,          setPrefix]          = useState(initialData?.prefix ?? '');
  const [firstName,       setFirstName]       = useState(initialData?.firstName ?? '');
  const [middleName,      setMiddleName]      = useState(initialData?.middleName ?? '');
  const [lastName,        setLastName]        = useState(initialData?.lastName ?? '');
  const [cellPhone,       setCellPhone]       = useState(initialData?.cellPhone ?? '');
  const [addressType,     setAddressType]     = useState(initialData?.addressType ?? '');
  const [country,         setCountry]         = useState(initialData?.country ?? '');
  const [state,           setState]           = useState(initialData?.state ?? '');
  const [line1,           setLine1]           = useState(initialData?.line1 ?? '');
  const [line2,           setLine2]           = useState(initialData?.line2 ?? '');
  const [city,            setCity]            = useState(initialData?.city ?? '');
  const [zipCode,         setZipCode]         = useState(initialData?.zipCode ?? '');

  // ── Lookup options ──────────────────────────────────────────────────────────
  const [countries,          setCountries]         = useState<{ countryId: number; name: string }[]>([]);
  const [prefixOptions,      setPrefixOptions]     = useState<{ text: string; value: number }[]>([]);
  const [addressTypeOptions, setAddressTypeOptions] = useState<{ text: string; value: number }[]>([]);
  const [stateOptions,       setStateOptions]      = useState<{ stateId: number; name: string }[]>([]);
  const [statesLoading,      setStatesLoading]     = useState(false);
  const lastCountryRef = useRef(initialData?.country ?? '');

  useEffect(() => {
    Promise.all([
      memberRegistrationService.getCountryList(),
      memberRegistrationService.getContactPrefixes(),
      memberRegistrationService.getAddressTypes(),
    ])
      .then(([c, p, a]) => {
        setCountries(c.data?.data ?? []);
        setPrefixOptions(p.data?.data ?? []);
        setAddressTypeOptions(a.data?.data ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const previousCountry = lastCountryRef.current;
    lastCountryRef.current = country;

    if (!country) {
      setStateOptions([]);
      setState('');
      setErrors((p) => ({ ...p, state: '' }));
      return;
    }

    const countryChanged = previousCountry !== country;
    if (countryChanged) {
      setState('');
      setErrors((p) => ({ ...p, state: '' }));
    }

    setStatesLoading(true);
    memberRegistrationService.getStatesByCountry(Number(country))
      .then((res: any) => setStateOptions(res.data?.data?.[0]?.states ?? []))
      .catch(() => setStateOptions([]))
      .finally(() => setStatesLoading(false));
  }, [country]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setFieldError = useCallback((field: keyof Step2Errors, msg = '') => {
    setErrors((p) => ({ ...p, [field]: msg }));
  }, []);

  const sanitizeName  = (v: string) => v.replace(/[^a-zA-Z\s'-]/g, '').replace(/\s{2,}/g, ' ');
  const sanitizePhone = (v: string) => {
    const t = v.trim();
    return t.startsWith('+')
      ? `+${t.slice(1).replace(/\D/g, '').slice(0, 15)}`
      : t.replace(/\D/g, '').slice(0, 15);
  };
  const nameLabel = (f: 'firstName' | 'middleName' | 'lastName') =>
    f === 'firstName' ? 'First name' : f === 'middleName' ? 'Middle name' : 'Last name';

  const validateNameField = (f: 'firstName' | 'middleName' | 'lastName', value: string, required = false) => {
    const label = nameLabel(f);
    const t = value.trim();
    if (required && !t) return `${label} is required`;
    if (t && t.length < 2) return `${label} must be at least 2 characters`;
    if (t && !/^[a-zA-Z\s'-]+$/.test(t)) return `${label} can only contain letters`;
    if (!CommonMethod.MaxLengthValidation(value, 20)) return `${label} cannot exceed 20 characters`;
    return '';
  };

  const validatePrefixField = (value: string) => {
    if (!value) return 'Prefix is required';
    if (!/^\d+$/.test(value)) return 'Please select a valid prefix';
    return '';
  };

  const validateStep2Password = (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8 || value.length > 20) {
      return 'Password must be 8-20 characters long';
    }
    if (!/(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
      return 'Password must include lowercase, number, and special character';
    }
    return '';
  };

  const validatePhoneField = (v: string) => {
    if (!v.trim()) return '';
    // ValidatePhone returns null on success, error string on failure
    return CommonMethod.ValidatePhone(v.trim()) ?? '';
  };

  const validateAddressFields = () => {
    const e: Step2Errors = {};
    if (!addressType) e.addressType = 'Address type is required';
    else if (!/^\d+$/.test(addressType)) e.addressType = 'Please select a valid address type';
    if (!line1.trim()) e.line1 = 'Line 1 is required';
    else {
      const l1 = CommonMethod.ValidateStreet(line1, 'Line 1', 50);
      if (l1) e.line1 = l1;
    }
    if (country && !/^\d+$/.test(country)) e.country = 'Please select a valid country';
    if (state.trim() && !CommonMethod.MaxLengthValidation(state, 50)) e.state = 'State / Province cannot exceed 50 characters';
    if (line2 && !CommonMethod.MaxLengthValidation(line2, 50)) e.line2 = 'Line 2 cannot exceed 50 characters';
    if (city.trim()) {
      const cityErr = CommonMethod.ValidateCity(city, 'City', 20);
      if (cityErr) e.city = cityErr;
    }
    if (zipCode.trim()) {
      const zipErr = CommonMethod.ValidateZipCode(zipCode, 10);
      if (zipErr) e.zipCode = zipErr;
    }
    return e;
  };

  const runValidation = () => {
    const e: Step2Errors = {};
    const emailVal = email.trim();
    if (!emailVal) e.email = 'Email is required';
    else if (!CommonMethod.EmailValidation(emailVal)) e.email = 'Please enter a valid email address';
    else if (!CommonMethod.MaxLengthValidation(emailVal, 254)) e.email = 'Email cannot exceed 254 characters';

    if (!password) e.password = 'Password is required';
    else if (!CommonMethod.PasswordValidation(password))
      e.password = 'Password must be 8-20 chars with a number and special character';

    if (!confirmPassword) e.confirmPassword = 'Confirm password is required';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';

    const prefixErr = validatePrefixField(prefix);
    if (prefixErr) e.prefix = prefixErr;

    const fnErr = validateNameField('firstName', firstName, true);  if (fnErr) e.firstName = fnErr;
    const mnErr = validateNameField('middleName', middleName);       if (mnErr) e.middleName = mnErr;
    const lnErr = validateNameField('lastName',  lastName,  true);  if (lnErr) e.lastName = lnErr;
    const phErr = validatePhoneField(cellPhone); if (phErr) e.cellPhone = phErr;

    Object.assign(e, validateAddressFields());
    setErrors(e);
    const first = Object.values(e).find(Boolean);
    if (first) { toast({ title: first, status: 'error', position: 'top-right' }); return false; }
    return true;
  };

  // ── Change handlers ─────────────────────────────────────────────────────────
  const handleEmailChange = (v: string) => {
    const next = v.slice(0, 254); setEmail(next);
    if (!next.trim()) return setFieldError('email', 'Email is required');
    if (!CommonMethod.EmailValidation(next.trim())) return setFieldError('email', 'Please enter a valid email address');
    setFieldError('email', '');
  };

  const handlePasswordChange = (v: string) => {
    const next = v.slice(0, 20); setPassword(next);
    if (!next) setFieldError('password', 'Password is required');
    else if (!CommonMethod.PasswordValidation(next))
      setFieldError('password', 'Password must be 8-20 chars with uppercase, lowercase, number, and special character');
    else setFieldError('password', '');
    if (confirmPassword && next !== confirmPassword) setFieldError('confirmPassword', 'Passwords do not match');
    else if (confirmPassword) setFieldError('confirmPassword', '');
  };

  const handleConfirmPasswordChange = (v: string) => {
    const next = v.slice(0, 20); setConfirmPassword(next);
    if (!next) setFieldError('confirmPassword', 'Confirm password is required');
    else if (password !== next) setFieldError('confirmPassword', 'Passwords do not match');
    else setFieldError('confirmPassword', '');
  };

  const handleNameChange = (f: 'firstName' | 'middleName' | 'lastName', v: string) => {
    const s = sanitizeName(v).slice(0, 20);
    if (f === 'firstName') setFirstName(s);
    if (f === 'middleName') setMiddleName(s);
    if (f === 'lastName') setLastName(s);
    setFieldError(f, validateNameField(f, s, f !== 'middleName'));
  };

  const handlePrefixChange = (v: string) => {
    setPrefix(v);
    setFieldError('prefix', validatePrefixField(v));
  };

  const handlePhoneChange = (v: string) => {
    const s = sanitizePhone(v); setCellPhone(s);
    setFieldError('cellPhone', validatePhoneField(s));
  };

  const handleLine1Change = (v: string) => {
    const next = v.slice(0, 50); setLine1(next);
    if (!next.trim()) return setFieldError('line1', 'Line 1 is required');
    setFieldError('line1', CommonMethod.ValidateStreet(next, 'Line 1', 50) ?? '');
  };
  const handleLine2Change = (v: string) => {
    const next = v.slice(0, 50); setLine2(next);
    if (!next.trim()) return setFieldError('line2', '');
    setFieldError('line2', CommonMethod.MaxLengthValidation(next, 50) ? '' : 'Line 2 cannot exceed 50 characters');
  };
  const handleCityChange = (v: string) => {
    const next = v.slice(0, 20); setCity(next);
    if (!next.trim()) return setFieldError('city', '');
    setFieldError('city', CommonMethod.ValidateCity(next, 'City', 20) ?? '');
  };
  const handleZipChange = (v: string) => {
    const next = v.slice(0, 10); setZipCode(next);
    if (!next.trim()) return setFieldError('zipCode', '');
    setFieldError('zipCode', CommonMethod.ValidateZipCode(next, 10) ?? '');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCropSrc(URL.createObjectURL(file)); e.target.value = '';
  };
  const handleCropSave = (blob: Blob, previewUrl: string) => {
    setProfilePhoto(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    setPhotoPreview(previewUrl); setCropSrc(null);
  };

  const handleContinue = () => {
    if (!runValidation()) return;
    onContinue({ email, password, confirmPassword, profilePhoto, prefix,
      firstName, middleName, lastName, cellPhone, addressType, country,
      state, line1, line2, city, zipCode });
  };

  return {
    // state
    errors, email, password, confirmPassword, profilePhoto, photoPreview, cropSrc,
    prefix, firstName, middleName, lastName, cellPhone, addressType, country, state,
    line1, line2, city, zipCode,
    // lookup options
    countries, prefixOptions, addressTypeOptions, stateOptions, statesLoading,
    // refs
    photoRef,
    // handlers
    handleEmailChange, handlePasswordChange, handleConfirmPasswordChange,
    handleNameChange, handlePhoneChange,
    handleLine1Change, handleLine2Change, handleCityChange, handleZipChange,
    handlePhotoChange, handleCropSave, handleContinue,
    setPrefix: handlePrefixChange,
    setAddressType: (v: string) => { setAddressType(v); setFieldError('addressType', v ? '' : 'Address type is required'); },
    setCountry:     (v: string) => { setCountry(v);     setFieldError('country',     ''); },
    setStateValue:  (v: string) => {
      if (stateOptions.length > 0) setState(v); else setState(v.slice(0, 50));
      setFieldError('state', '');
    },
    removePhoto: () => { setProfilePhoto(null); setPhotoPreview(null); },
    openCrop:    () => photoRef.current?.click(),
    setCropSrc,
  };
}
