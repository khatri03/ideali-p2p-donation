import { useState, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import membershipWizardService from '../../../services/membershipWizardService';

export interface DiscountCoupon {
  id: number;
  uniqueId?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  expiryDate: string | null;
  usageLimit: number | null;
  isActive?: boolean;
}

interface UseStep07DiscountsProps {
  membershipId: string | null;
  isEditMode?: boolean;
  onComplete: () => void;
}

export function useStep07Discounts({ membershipId, isEditMode, onComplete }: UseStep07DiscountsProps) {
  const toast = useToast();
  const [discountsEnabled, setDiscountsEnabledRaw] = useState(false);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  // Remembers each coupon's active state from right before discounts were turned off,
  // so re-enabling restores exactly which coupons were active vs. inactive.
  const savedActiveRef = useRef<Record<number, boolean>>({});
  const [deletedCouponIds, setDeletedCouponIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!membershipId && !!isEditMode);

  useEffect(() => {
    if (!membershipId || !isEditMode) return;
    setIsLoading(true);
    membershipWizardService.getDiscountCoupons(membershipId)
      .then((res) => {
        const d = res.data?.data;
        if (!d) return;
        setDiscountsEnabledRaw(d.discountsEnabled ?? false);
        if (Array.isArray(d.coupons) && d.coupons.length > 0) {
          setCoupons(
            d.coupons.map((c, i) => ({
              id: Date.now() + i,
              uniqueId: c.uniqueId,
              code: c.code,
              discountType: c.discountType === 'Percentage' ? 'percentage' : 'fixed',
              discountValue: c.discountValue,
              maxDiscountAmount: c.maxDiscountAmount ?? undefined,
              expiryDate: null,
              usageLimit: c.totalCoupons ?? null,
              isActive: c.isActive,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [membershipId]);

  useEffect(() => {
    const hasActiveCoupon = coupons.some((c) => c.isActive);
    if (!hasActiveCoupon) setDiscountsEnabledRaw(false);
  }, [coupons]);

  // Turning discounts off deactivates every coupon (remembering their prior state);
  // turning back on restores each coupon to whatever it was before.
  const setDiscountsEnabled = (next: boolean) => {
    if (!next) {
      const snapshot: Record<number, boolean> = {};
      coupons.forEach((c) => { snapshot[c.id] = c.isActive ?? true; });
      savedActiveRef.current = snapshot;
      setCoupons((prev) => prev.map((c) => ({ ...c, isActive: false })));
    } else {
      setCoupons((prev) =>
        prev.map((c) => ({ ...c, isActive: savedActiveRef.current[c.id] ?? c.isActive ?? true })),
      );
    }
    setDiscountsEnabledRaw(next);
  };

  const addCoupon = (data?: Omit<DiscountCoupon, 'id'>) => {
    setCoupons((prev) => [
      ...prev,
      {
        id: Date.now(),
        code: data?.code ?? '',
        discountType: data?.discountType ?? 'fixed',
        discountValue: data?.discountValue ?? 0,
        maxDiscountAmount: data?.maxDiscountAmount ?? 0,
        expiryDate: data?.expiryDate ?? null,
        usageLimit: data?.usageLimit ?? null,
        isActive: data?.isActive ?? true,
      },
    ]);
  };

  const updateCoupon = (id: number, patch: Partial<Omit<DiscountCoupon, 'id'>>) =>
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const removeCoupon = (id: number) => {
    const coupon = coupons.find((c) => c.id === id);
    if (coupon?.uniqueId) {
      setDeletedCouponIds((prev) => [...prev, coupon.uniqueId!]);
    }
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  const submit = async () => {
    if (!membershipId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await membershipWizardService.batchSaveDiscountCoupons({
        moduleType: 'Membership',
        moduleEntityUniqueId: membershipId,
        discountsEnabled,
        coupons: coupons.map((c) => ({
          uniqueId: c.uniqueId,
          code: c.code,
          discountType: c.discountType === 'percentage' ? 'Percentage' : 'FixedAmount',
          discountValue: c.discountValue,
          maxDiscountAmount: c.maxDiscountAmount ?? null,
          totalCoupons: c.usageLimit ?? null,
          isActive: c.isActive ?? true,
        })),
        deletedCouponIds,
      });
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
      await membershipWizardService.batchSaveDiscountCoupons({
        moduleType: 'Membership',
        moduleEntityUniqueId: membershipId,
        discountsEnabled,
        coupons: coupons.map((c) => ({
          uniqueId: c.uniqueId,
          code: c.code,
          discountType: c.discountType === 'percentage' ? 'Percentage' : 'FixedAmount',
          discountValue: c.discountValue,
          maxDiscountAmount: c.maxDiscountAmount ?? null,
          totalCoupons: c.usageLimit ?? null,
          isActive: c.isActive ?? true,
        })),
        deletedCouponIds,
      });
      onExit();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message ?? 'Failed to save', status: 'error', position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { discountsEnabled, setDiscountsEnabled, coupons, addCoupon, removeCoupon, updateCoupon, isLoading, isSubmitting, submit, saveAndExit };
}
