import HttpClient from 'app/service/httpClient/HttpClient';
import type {
  InvoiceDocumentData,
  InvoiceDocumentMember,
} from 'app/components/organizer/membership/common/InvoiceDocument';
import type {
  MembershipPaymentDetailLineItem,
  MembershipPaymentDetailNote,
} from 'app/components/organizer/membership/services/membershipPaymentService';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: unknown | null;
  meta: unknown | null;
  timestamp: string;
}

export interface MemberInvoiceDetailContactAddress {
  streetLine1: string | null;
  streetLine2: string | null;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface MemberInvoiceDetailContact {
  uniqueId: string;
  prefix: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  primaryEmail: string | null;
  secondaryEmail: string | null;
  workEmail: string | null;
  cellPhone: string | null;
  workPhone: string | null;
  homePhone: string | null;
  address: MemberInvoiceDetailContactAddress | null;
}

export interface MemberInvoiceDetailContext {
  module: string;
  uniqueId: string;
  memberUniqueId: string;
  name: string;
  isMemberInvoice: boolean;
}

export interface MemberInvoiceDetailPayment {
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentSource: string | null;
  referenceNo: string | null;
  note: string | null;
  paymentDateUtc: string;
  createdBy: string;
  createdOnUtc: string;
}

export interface MemberInvoiceDetailResponse {
  contact: MemberInvoiceDetailContact | null;
  isMember: boolean;
  uniqueId: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
  invoiceStatus: string;
  invoiceType: string;
  balanceAmount: number | null;
  discountAmount: number;
  currencySymbol: string;
  logoUrl: string | null;
  invoiceContext: MemberInvoiceDetailContext | null;
  invoiceItems: MembershipPaymentDetailLineItem[];
  notes: MembershipPaymentDetailNote[];
  payments: MemberInvoiceDetailPayment[];
}

function formatName(contact: MemberInvoiceDetailContact | null) {
  if (!contact) return '';
  return [contact.prefix, contact.firstName, contact.middleName, contact.lastName]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .join(' ')
    .trim();
}

function val(v: string | null | undefined) {
  return v && v.trim() ? v : '';
}

function mapToInvoiceDocumentData(
  detail: MemberInvoiceDetailResponse,
): InvoiceDocumentData {
  const payment = detail.payments?.[0];
  const contact = detail.contact;
  const name = formatName(contact);
  const netTotal = detail.invoiceItems.reduce((sum, item) => sum + item.total, 0);

  const member: InvoiceDocumentMember = {
    name,
    email: val(contact?.primaryEmail ?? contact?.secondaryEmail ?? contact?.workEmail),
    phone: val(contact?.cellPhone ?? contact?.workPhone ?? contact?.homePhone),
    streetLine1: contact?.address?.streetLine1 ?? null,
    streetLine2: contact?.address?.streetLine2 ?? null,
    zip: contact?.address?.zipCode ?? null,
  };

  return {
    invoiceNo: detail.invoiceNo,
    invoiceDate: detail.invoiceDate,
    invoiceAmount: detail.invoiceAmount,
    paymentMethod: payment?.paymentMethod ?? '—',
    paymentSource: payment?.paymentSource ?? null,
    paymentStatus: detail.invoiceStatus,
    membershipName: detail.invoiceContext?.name ?? 'Membership',
    currencySymbol: detail.currencySymbol,
    member,
    notes: detail.notes ?? [],
    lineItems: detail.invoiceItems ?? [],
    netTotal,
  };
}

const membershipInvoiceService = {
  async getInvoiceDetail(invoiceId: string): Promise<InvoiceDocumentData | null> {
    try {
      const response = await HttpClient.get<ApiResponse<MemberInvoiceDetailResponse>>(
        `/api/participant/membership/${invoiceId}/invoice-detail`,
      );
      const detail = response.data?.data;
      if (!response.data.success || !detail) return null;
      return mapToInvoiceDocumentData(detail);
    } catch (error) {
      console.error('Error fetching member invoice detail:', error);
      return null;
    }
  },

  async sendInvoiceEmail(
    invoiceId: string,
    payload: {
      toEmail: string;
      notifyOrganizer: boolean;
      otherNotificationEmails: string[];
    },
  ): Promise<void> {
    await HttpClient.post(`/api/participant/membership/${invoiceId}/send-email`, payload);
  },

  // Renders the public invoice view page to a PDF via the screenshot service
  async downloadInvoicePDF(invoiceId: string): Promise<Blob> {
    const response = await HttpClient.get(
      `/api/pdf/from-url?url=${encodeURIComponent(`public/membership-invoice/${invoiceId}/view?pdf=true`)}`,
      {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      },
    );
    return response.data;
  },
};

export default membershipInvoiceService;
