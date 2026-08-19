import { useState, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';
import { UpgradePath } from './AddUpgradePathModal';

const CHARGE_RULE_API_MAP: Record<UpgradePath['chargeRule'], 'FullPrice' | 'FixedAmount' | 'Free'> = {
  full_price: 'FullPrice',
  fixed_amount: 'FixedAmount',
  no_charge: 'Free',
};

const CHARGE_RULE_FROM_API: Record<string, UpgradePath['chargeRule']> = {
  FullPrice: 'full_price',
  FixedAmount: 'fixed_amount',
  Free: 'no_charge',
};

interface UseStep10AdvanceProps {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
}

// Convert "2026-05-21T19:20:58.514Z" → "2026-05-21T19:20" for datetime-local input
const toInputValue = (iso: string | null): string => {
  if (!iso) return '';
  return iso.slice(0, 16);
};

// Convert "2026-05-21T19:20" → "2026-05-21T19:20:00.000Z"
const toIso = (local: string): string | null => {
  if (!local) return null;
  return new Date(local).toISOString();
};

export function useStep10Advance({ membershipId, isEditMode, onComplete }: UseStep10AdvanceProps) {
  const toast = useToast();
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [registrationWindowEnabled, setRegistrationWindowEnabled] = useState(false);
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationEnd, setRegistrationEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!membershipId && !!isEditMode);
  const [upgradePaths, setUpgradePaths] = useState<UpgradePath[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    if (!membershipId || !isEditMode) return;
    setIsLoading(true);
    Promise.all([
      membershipWizardService.getWizardAdvanceSettings(membershipId),
      membershipWizardService.getUpgradePaths(membershipId),
    ])
      .then(([settingsRes, pathsRes]) => {
        const d = settingsRes.data?.data;
        if (d) {
          setRequiresApproval(d.requiresApproval === true);
          const start = toInputValue(d.registrationStartDateUtc);
          const end = toInputValue(d.registrationEndDateUtc);
          setRegistrationStart(start);
          setRegistrationEnd(end);
          setRegistrationWindowEnabled(!!(start || end));
        }
        const paths = pathsRes.data?.data ?? [];
        setUpgradePaths(paths.map((p) => ({
          id: nextId.current++,
          uniqueId: p.uniqueId,
          toMembershipUniqueId: p.toMembershipTypeUniqueId,
          toMembershipName: p.toMembershipTypeName,
          chargeRule: CHARGE_RULE_FROM_API[p.chargeRule] ?? 'full_price',
          fixedAmount: p.fixedUpgradeAmount ?? 0,
          requiresApproval: p.requiresApproval,
          isActive: p.isActive,
        })));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  const addUpgradePath = (path: Omit<UpgradePath, 'id'>) =>
    setUpgradePaths((prev) => [...prev, { ...path, id: nextId.current++ }]);

  const updateUpgradePath = (id: number, path: Omit<UpgradePath, 'id'>) =>
    setUpgradePaths((prev) => prev.map((p) => p.id === id ? { ...path, id } : p));

  const removeUpgradePath = (id: number) =>
    setUpgradePaths((prev) => prev.filter((p) => p.id !== id));

  const buildPayload = () => ({
    requiresApproval,
    registrationStartDateUtc: registrationWindowEnabled ? toIso(registrationStart) : null,
    registrationEndDateUtc: registrationWindowEnabled ? toIso(registrationEnd) : null,
    upgradePaths: upgradePaths.map((p) => ({
      toMembershipTypeUniqueId: p.toMembershipUniqueId,
      chargeRule: CHARGE_RULE_API_MAP[p.chargeRule],
      fixedUpgradeAmount: p.chargeRule === 'fixed_amount' ? p.fixedAmount : null,
      requiresApproval: p.requiresApproval,
      isActive: p.isActive,
    })),
  });

  const submit = async () => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await membershipWizardService.saveWizardAdvanceSettings(membershipId, buildPayload(), 10);
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAndExit = async (onExit: () => void) => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await membershipWizardService.saveWizardAdvanceSettings(membershipId, buildPayload(), 10);
      onExit();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    requiresApproval, setRequiresApproval,
    registrationWindowEnabled, setRegistrationWindowEnabled,
    registrationStart, setRegistrationStart,
    registrationEnd, setRegistrationEnd,
    upgradePaths, addUpgradePath, updateUpgradePath, removeUpgradePath,
    isLoading, isSubmitting, submit, saveAndExit,
  };
}
