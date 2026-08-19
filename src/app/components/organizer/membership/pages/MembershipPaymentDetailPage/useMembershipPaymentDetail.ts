import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import membershipPaymentService, {
  MembershipPaymentDetailLineItem,
  MembershipPaymentDetailNote,
} from '../../services/membershipPaymentService';
import memberProfileService from '../../services/memberProfileService';

export interface DetailMember {
  uniqueId: string;
  name: string;
  email: string;
  phone: string;
  streetLine1: string | null;
  streetLine2: string | null;
  zip: string | null;
}

export interface DetailViewModel {
  invoiceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
  discountAmount: number;
  balanceAmount: number | null;
  paymentMethod: string;
  paymentSource: string | null;
  paymentStatus: string;
  membershipName: string;
  currencySymbol: string;
  member: DetailMember;
  notes: MembershipPaymentDetailNote[];
  lineItems: MembershipPaymentDetailLineItem[];
  netTotal: number;
}

export function useMembershipPaymentDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const toast = useToast();

  const [detail, setDetail] = useState<DetailViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setError('Invoice ID is missing.');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    membershipPaymentService
      .getMembershipPaymentSummary(invoiceId)
      .then(async (res) => {
        if (!isMounted) return;
        const summary = res.data?.data;
        if (!summary) {
          setError('No invoice data found.');
          return;
        }

        // Fetch member profile, line items, and notes in parallel; all are non-fatal
        const [profileResult, lineItemsResult, notesResult] = await Promise.allSettled([
          memberProfileService.getMemberProfile(summary.memberUniqueId),
          membershipPaymentService.getMembershipPaymentLineItems(invoiceId),
          membershipPaymentService.getMembershipPaymentNotes(invoiceId),
        ]);

        let member: DetailMember = {
          uniqueId: summary.memberUniqueId,
          name: '',
          email: '',
          phone: '',
          streetLine1: null,
          streetLine2: null,
          zip: null,
        };

        if (profileResult.status === 'fulfilled') {
          const p = profileResult.value.data?.data;
          if (p) {
            const { contact, address } = p;
            const nameParts = [
              contact.prefix,
              contact.firstName,
              contact.middleName,
              contact.lastName,
            ].filter((s): s is string => !!s && s.trim().length > 0);
            member = {
              uniqueId: p.uniqueId,
              name: nameParts.join(' ').trim(),
              email: contact.email ?? '',
              phone: contact.cellPhone ?? '',
              streetLine1: address.streetLine1,
              streetLine2: address.streetLine2,
              zip: address.zipCode,
            };
          }
        }

        const lineItems =
          lineItemsResult.status === 'fulfilled'
            ? (lineItemsResult.value.data?.data ?? [])
            : [];

        const notes =
          notesResult.status === 'fulfilled'
            ? (notesResult.value.data?.data ?? [])
            : [];

        const netTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

        if (!isMounted) return;
        setDetail({
          invoiceNo: summary.invoiceNo,
          invoiceDate: summary.invoiceDate,
          invoiceAmount: summary.invoiceAmount,
          discountAmount: summary.discountAmount,
          balanceAmount: summary.balanceAmount,
          paymentMethod: summary.paymentMethod,
          paymentSource: summary.paymentSource,
          paymentStatus: summary.paymentStatus,
          membershipName: summary.membershipName,
          currencySymbol: summary.currencySymbol,
          member,
          notes,
          lineItems,
          netTotal,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Failed to load invoice details.');
        toast({
          title: 'Failed to load invoice',
          status: 'error',
          position: 'top-right',
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  return { invoiceId, detail, isLoading, error };
}
