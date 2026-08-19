import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

export interface CustomForm {
  id: number;
  uniqueId?: string;
  name: string;
}

export interface QuestionOption {
  uniqueId?: string;
  displayText: string;
  value: string;
  isDefault: boolean;
}

export interface CustomQuestion {
  id: number;
  uniqueId?: string;
  controlId: number;
  controlName: string;
  controlType: string;
  iconClass: string;
  label: string;
  placeHolder: string;
  tooltip: string;
  required: boolean;
  requiredMessage: string;
  acceptedFileTypes: string;
  minLength: string;
  maxLength: string;
  defaultValue: string;
  displayOrder: number;
  options: QuestionOption[];
}

interface UseStep08Props {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
}

export function useStep08({ membershipId, isEditMode, onComplete }: UseStep08Props) {
  const toast = useToast();
  const [availableForms, setAvailableForms] = useState<CustomForm[]>([]);
  const [selectedForms, setSelectedForms] = useState<CustomForm[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const fetchForms = membershipWizardService.getCustomFormListItems();
    const fetchQuestions = (membershipId && isEditMode)
      ? membershipWizardService.getWizardQuestions(membershipId)
      : Promise.resolve(null);

    Promise.all([fetchForms, fetchQuestions])
      .then(([formsRes, questionsRes]) => {
        // Build available forms list from API
        const forms: CustomForm[] = (formsRes.data?.data ?? []).map((f, i) => ({
          id: i + 1,
          uniqueId: f.value,
          name: f.text,
        }));
        setAvailableForms(forms);

        if (questionsRes) {
          const d = questionsRes.data?.data;
          if (!d) return;

          // Pre-select saved custom forms
          if (Array.isArray(d.customFormUniqueIds) && d.customFormUniqueIds.length > 0) {
            setSelectedForms(
              forms.filter((f) => f.uniqueId && d.customFormUniqueIds.includes(f.uniqueId)),
            );
          }

          // Load saved custom questions
          if (Array.isArray(d.customQuestions) && d.customQuestions.length > 0) {
            setCustomQuestions(
              d.customQuestions
                .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                .map((q: any, i: number) => ({
                  id: Date.now() + i,
                  uniqueId: q.uniqueId,
                  controlId: q.controlId,
                  controlName: q.controlName,
                  controlType: q.controlType,
                  iconClass: q.iconClass,
                  label: q.label,
                  placeHolder: q.placeHolder,
                  tooltip: q.tooltip,
                  required: q.required,
                  requiredMessage: q.requiredMessage,
                  acceptedFileTypes: q.acceptedFileTypes,
                  minLength: q.minLength,
                  maxLength: q.maxLength,
                  defaultValue: q.defaultValue,
                  displayOrder: q.displayOrder,
                  options: q.options ?? [],
                })),
            );
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  const toggleForm = (form: CustomForm) => {
    setSelectedForms((prev) =>
      prev.find((f) => f.id === form.id)
        ? prev.filter((f) => f.id !== form.id)
        : [...prev, form],
    );
  };

  const removeForm = (id: number) =>
    setSelectedForms((prev) => prev.filter((f) => f.id !== id));

  const addQuestion = (data: Omit<CustomQuestion, 'id' | 'displayOrder'>) => {
    setCustomQuestions((prev) => [
      ...prev,
      { ...data, id: Date.now(), displayOrder: prev.length + 1 },
    ]);
  };

  const removeQuestion = (id: number) =>
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));

  const updateQuestion = (id: number, data: Omit<CustomQuestion, 'id' | 'displayOrder'>) =>
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data } : q)),
    );

  const buildPayload = () => ({
    customFormUniqueIds: selectedForms.filter((f) => f.uniqueId).map((f) => f.uniqueId!),
    customQuestions: customQuestions.map((q, i) => ({
      uniqueId: q.uniqueId,
      controlId: q.controlId,
      controlName: q.controlName,
      controlType: q.controlType,
      iconClass: q.iconClass,
      label: q.label,
      placeHolder: q.placeHolder,
      tooltip: q.tooltip,
      required: q.required,
      requiredMessage: q.requiredMessage,
      acceptedFileTypes: q.acceptedFileTypes,
      minLength: q.minLength,
      maxLength: q.maxLength,
      defaultValue: q.defaultValue,
      displayOrder: i + 1,
      options: q.options,
    })),
  });

  const saveData = async () => {
    if (!membershipId) return;
    await membershipWizardService.saveWizardQuestions(membershipId, buildPayload(), 8);
  };

  const submit = async () => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveData();
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    availableForms,
    selectedForms, setSelectedForms, toggleForm, removeForm,
    customQuestions, setCustomQuestions,
    addQuestion, updateQuestion, removeQuestion,
    isLoading, isSubmitting, saveData, submit,
  };
}
