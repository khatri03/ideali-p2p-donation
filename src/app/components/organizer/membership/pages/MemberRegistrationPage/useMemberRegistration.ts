import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import memberRegistrationService from '../../services/memberRegistrationService';
import { MemberRegistrationInfo } from '../../types';
import { Step2Data } from '../../memberRegistration/Step2YourInformation';
import { QuestionnaireValues } from '../../memberRegistration/Step3Questionnaire';
import { Step4PaymentResult } from '../../memberRegistration/Step4Payment';

export interface SuccessData {
  memberName: string;
}

export function useMemberRegistration() {
  const navigate = useNavigate();
  const toast = useToast();
  const { membershipId } = useParams<{ membershipId?: string }>();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [info, setInfo] = useState<MemberRegistrationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<QuestionnaireValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // ── Load membership info ──────────────────────────────────────────────────

  useEffect(() => {
    if (!membershipId) {
      setIsLoading(false);
      setError('No membership ID provided.');
      return;
    }
    memberRegistrationService
      .getMemberRegistrationInfo(membershipId)
      .then((res: any) => {
        if (res.data?.success && res.data.data) {
          setInfo(res.data.data);
        } else {
          setError(res.data?.message ?? 'Unable to load membership details.');
        }
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.message ??
            err?.message ??
            'Unable to load membership details.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  // ── Step navigation ───────────────────────────────────────────────────────

  const goNext = () =>
    setCurrentStep((s) => {
      const next = Math.min(4, s + 1);
      setMaxReachedStep((max) => Math.max(max, next));
      setServerErrors([]);
      return next;
    });

  const goBack = () => {
    setServerErrors([]);
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  // ── Submit registration ───────────────────────────────────────────────────

  const handleComplete = async (paymentResult: Step4PaymentResult) => {
    if (!membershipId || !info) return;
    if (!step2Data) {
      toast({
        title: 'Please complete Your Information (Step 2) first.',
        status: 'warning',
        position: 'top-right',
      });
      setCurrentStep(2);
      return;
    }

    const fd = new FormData();

    // Contact info
    fd.append('ContactInfo.Prefix', String(Number(step2Data.prefix) || 0));
    fd.append('ContactInfo.FirstName', step2Data.firstName);
    if (step2Data.middleName)
      fd.append('ContactInfo.MiddleName', step2Data.middleName);
    fd.append('ContactInfo.LastName', step2Data.lastName);
    fd.append('ContactInfo.PrimaryEmail', step2Data.email);
    fd.append('ContactInfo.CellPhone', step2Data.cellPhone);
    fd.append('ContactInfo.Address.StreetLine1', step2Data.line1);
    if (step2Data.line2)
      fd.append('ContactInfo.Address.StreetLine2', step2Data.line2);
    fd.append('ContactInfo.Address.ZipCode', step2Data.zipCode);

    // User info
    fd.append('UserInfo.Email', step2Data.email);
    fd.append('UserInfo.Password', step2Data.password);
    fd.append('UserInfo.ConfirmPassword', step2Data.confirmPassword);

    // Address info
    fd.append(
      'AddressInfo.AddressType',
      String(Number(step2Data.addressType) || 1),
    );
    fd.append('AddressInfo.StreetLine1', step2Data.line1);
    if (step2Data.line2) fd.append('AddressInfo.StreetLine2', step2Data.line2);
    fd.append('AddressInfo.ZipCode', step2Data.zipCode);
    fd.append('AddressInfo.CityName', step2Data.city);
    fd.append('AddressInfo.CountryId', String(Number(step2Data.country) || 0));
    fd.append('AddressInfo.StateId', String(Number(step2Data.state) || 0));

    // Avatar
    if (step2Data.profilePhoto) {
      fd.append(
        'AvatarFile',
        step2Data.profilePhoto,
        step2Data.profilePhoto.name,
      );
    }

    // Invoice amounts
    const membership = info.membershipDetail.membershipCharges;
    const discount = paymentResult.discountAmount;
    const tip = paymentResult.tipAmount;
    const final = Math.max(membership - discount, 0);
    const invoice = final + tip;

    fd.append('InvoiceDetail.InvoiceAmount', String(invoice));
    fd.append(
      'InvoiceDetail.AmountBreakdown.MembershipAmount',
      String(membership),
    );
    fd.append('InvoiceDetail.AmountBreakdown.DiscountAmount', String(discount));
    fd.append('InvoiceDetail.AmountBreakdown.FinalAmount', String(final));
    fd.append('InvoiceDetail.AmountBreakdown.TipAmount', String(tip));
    fd.append(
      'InvoiceDetail.AmountBreakdown.ApplicationFeeAmount',
      String(tip),
    );
    fd.append('InvoiceDetail.AmountBreakdown.TotalAmount', String(invoice));
    fd.append(
      'InvoiceDetail.PaymentMethod',
      String(paymentResult.paymentMethodNumericId),
    );
    fd.append(
      'InvoiceDetail.PaymentMethodDetail.PaymentMethodId',
      paymentResult.paymentMethodId,
    );
    if (paymentResult.paymentIntentId) {
      fd.append(
        'InvoiceDetail.PaymentMethodDetail.PaymentIntentId',
        paymentResult.paymentIntentId,
      );
    }
    fd.append(
      'InvoiceDetail.PaymentMethodDetail.CardHolderName',
      paymentResult.cardHolderName,
    );

    if (paymentResult.couponUniqueId) {
      fd.append('CouponUniqueId', paymentResult.couponUniqueId);
    }

    // Custom form field responses
    let cfIdx = 0;
    info.membershipDetail.customForms.forEach((form) => {
      form.fields.forEach((field) => {
        const val = step3Data?.[field.uniqueId];
        if (val === undefined || val === null || val === '') return;

        fd.append(`CustomFormResponses[${cfIdx}].FieldId`, String(field.id));

        if (val instanceof File) {
          fd.append(`CustomFormResponses[${cfIdx}].Value`, val.name);
          fd.append(`CustomFormResponses[${cfIdx}].File`, val, val.name);
        } else if (Array.isArray(val)) {
          if (val.length === 0) return;
          fd.append(`CustomFormResponses[${cfIdx}].Value`, JSON.stringify(val));
        } else {
          fd.append(`CustomFormResponses[${cfIdx}].Value`, String(val));
        }

        cfIdx++;
      });
    });

    // Custom question responses
    info.membershipDetail.customQuestions.forEach((q, i) => {
      const val = step3Data?.[q.uniqueId];
      if (val === undefined || val === '') return;
      const selectedOption = q.options.find((o) => o.value === String(val));
      fd.append(`CustomQuestionResponses[${i}].QuestionUniqueId`, q.uniqueId);
      if (selectedOption?.uniqueId)
        fd.append(
          `CustomQuestionResponses[${i}].OptionUniqueId`,
          selectedOption.uniqueId,
        );
      fd.append(`CustomQuestionResponses[${i}].Value`, String(val));
    });

    setServerErrors([]);
    setIsSubmitting(true);
    try {
      const res = await memberRegistrationService.registerMember(
        membershipId,
        fd,
      );
      if (res.data?.success) {
        const memberName = [step2Data.firstName, step2Data.lastName]
          .filter(Boolean)
          .join(' ');
        setSuccessData({ memberName });
      } else {
        const message = res.data?.message ?? 'Registration failed.';
        setServerErrors([message]);
        toast({ title: message, status: 'error', position: 'top-right' });
      }
    } catch (err: any) {
      const body = err?.response?.data;
      if (body?.errors && typeof body.errors === 'object') {
        const messages: string[] = [];
        Object.entries(body.errors as Record<string, string[]>).forEach(
          ([field, msgs]) => {
            const label = field.split('.').pop() ?? field;
            msgs.forEach((m) => messages.push(`${label}: ${m}`));
          },
        );
        setServerErrors(
          messages.length > 0 ? messages : [body.title ?? 'Validation failed.'],
        );
      } else {
        const message =
          body?.message ??
          err?.message ??
          'Registration failed. Please try again.';
        setServerErrors([message]);
        toast({ title: message, status: 'error', position: 'top-right' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reset after success ───────────────────────────────────────────────────

  const handleSuccessDone = () => {
    setSuccessData(null);
    setStep2Data(null);
    setStep3Data(null);
    setServerErrors([]);
    setCurrentStep(1);
    setMaxReachedStep(1);
    navigate(membershipId ? `/membership/register/${membershipId}` : '/membership/register', {
      replace: true,
    });
  };

  const themeColor = info?.membershipDetail?.color ?? '#044bd9';

  return {
    membershipId,
    navigate,
    currentStep,
    setCurrentStep,
    maxReachedStep,
    info,
    isLoading,
    error,
    themeColor,
    step2Data,
    setStep2Data,
    step3Data,
    setStep3Data,
    isSubmitting,
    serverErrors,
    setServerErrors,
    successData,
    handleComplete,
    handleSuccessDone,
    goNext,
    goBack,
  };
}
