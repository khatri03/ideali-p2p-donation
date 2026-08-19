import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import membershipPaymentService, {
  MembershipInvoiceView,
} from '../../services/membershipPaymentService';
import type { InvoiceDocumentData } from '../../common/InvoiceDocument';

function val(v: string | null | undefined) {
  return v && v.trim() ? v : '';
}

function mapToInvoiceDocumentData(view: MembershipInvoiceView): InvoiceDocumentData {
  const payment = view.payments?.[0];
  const contact = view.contact;

  const name = contact
    ? [contact.prefix, contact.firstName, contact.middleName, contact.lastName]
        .filter((s): s is string => !!s && s.trim().length > 0)
        .join(' ')
        .trim()
    : '';

  const netTotal = view.invoiceItems.reduce((sum, item) => sum + item.total, 0);

  return {
    invoiceNo: view.invoiceNo,
    invoiceDate: view.invoiceDate,
    invoiceAmount: view.invoiceAmount,
    paymentMethod: payment?.paymentMethod ?? '—',
    paymentSource: payment?.paymentSource ?? null,
    paymentStatus: view.invoiceStatus,
    membershipName: view.invoiceContext?.name ?? 'Membership',
    currencySymbol: view.currencySymbol,
    member: {
      name,
      email: val(contact?.primaryEmail ?? contact?.secondaryEmail ?? contact?.workEmail),
      phone: val(contact?.cellPhone ?? contact?.workPhone ?? contact?.homePhone),
      streetLine1: contact?.address?.streetLine1 ?? null,
      streetLine2: contact?.address?.streetLine2 ?? null,
      zip: contact?.address?.zipCode ?? null,
    },
    notes: view.notes,
    lineItems: view.invoiceItems,
    netTotal,
  };
}

export function useMembershipInvoiceView() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const [data, setData] = useState<InvoiceDocumentData | null>(null);
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
      .getMembershipInvoiceView(invoiceId)
      .then((res) => {
        if (!isMounted) return;
        const view = res.data?.data;
        if (!view) {
          setError('No invoice data found.');
          return;
        }
        setData(mapToInvoiceDocumentData(view));
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Failed to load invoice details.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  return { invoiceId, data, isLoading, error };
}
