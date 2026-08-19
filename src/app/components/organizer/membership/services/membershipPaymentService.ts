import HttpClient from 'app/service/httpClient/HttpClient';
import { getFileExtension } from 'app/components/organizer/donation/organizerDonationComponents/helperFuntions';

// ─── Response types ───────────────────────────────────────────────────────────

export interface PaymentListItem {
  invoiceId: string;
  invoiceNo: string;
  memberUniqueId: string;
  memberName: string;
  memberEmail: string;
  membershipName: string;
  invoiceStatus: string;
  invoiceDateUtc: string;
  discountAmount: number;
  totalAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  paymentSource: string | null;
  currencySymbol: string;
}

export interface PaymentListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: PaymentListItem[];
}

export interface PaymentListParams {
  pageNo?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string[];
  membershipTypeUniqueIds?: string[];
  paymentMethods?: string[];
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  sortBy?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

// ─── Summary response  (/api/invoice/membership/{uniqueId}/summary) ──────────

export interface MembershipPaymentSummary {
  uniqueId: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
  discountAmount: number;
  discountCouponCode: string | null;
  balanceAmount: number | null;
  paymentMethod: string;
  paymentSource: string | null;
  paymentStatus: string;
  membershipName: string;
  memberUniqueId: string;
  currencySymbol: string;
}

// ─── Line-item shape (for when the line-items endpoint is wired up) ───────────

export interface MembershipPaymentDetailLineItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
  invoiceItemStatus: string;
  taxCharges: { description: string | null; amount: number | null };
  serviceCharges: { description: string | null; amount: number | null };
  itemType: string;
}

export interface MembershipPaymentDetailNote {
  note: string;
  createdBy: string;
  createdOnUtc: string;
}

// ─── Public invoice view (/api/invoice/membership/{invoiceId}/view) ──────────

export interface MembershipInvoiceViewContactAddress {
  streetLine1: string | null;
  streetLine2: string | null;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface MembershipInvoiceViewContact {
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
  address: MembershipInvoiceViewContactAddress;
}

export interface MembershipInvoiceViewContext {
  module: string;
  uniqueId: string;
  memberUniqueId: string;
  name: string;
  isMemberInvoice: boolean;
}

export interface MembershipInvoiceViewPayment {
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

export interface MembershipInvoiceView {
  contact: MembershipInvoiceViewContact | null;
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
  invoiceContext: MembershipInvoiceViewContext | null;
  invoiceItems: MembershipPaymentDetailLineItem[];
  notes: MembershipPaymentDetailNote[];
  payments: MembershipInvoiceViewPayment[];
}

const membershipPaymentService = {
  // Membership type dropdown options for the payments filter
  getMembershipTypeOptions: () =>
    HttpClient.get<{ data: Array<{ value: string; text: string }>; success: boolean }>(
      '/api/organizer/membership/type/options',
    ),

  // Invoice status dropdown options for the payments filter
  getMembershipInvoiceStatusOptions: () =>
    HttpClient.get<{ data: Array<{ text: string; value: string }>; success: boolean }>(
      '/api/invoice/membership/status-options',
    ),

  // Paginated, filtered, sortable payments list
  // Uses paramsSerializer to send arrays as repeated keys: status=Paid&status=PendingPayment
  getMembershipPayments: (params: PaymentListParams) => {
    const query = new URLSearchParams();
    if (params.pageNo)     query.append('pageNo',     String(params.pageNo));
    if (params.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params.sortBy)     query.append('sortBy',     params.sortBy);
    params.status?.forEach((s) => query.append('status', s));
    params.membershipTypeUniqueIds?.forEach((id) => query.append('membershipTypeUniqueIds', id));
    params.paymentMethods?.forEach((m) => query.append('paymentMethods', m));
    if (params.invoiceDateFrom) query.append('invoiceDateFrom', params.invoiceDateFrom);
    if (params.invoiceDateTo)   query.append('invoiceDateTo',   params.invoiceDateTo);

    return HttpClient.get<{ data: PaymentListResponse; success: boolean }>(
      `/api/invoice/membership/list?${query.toString()}`,
    );
  },

  // Export membership payments list (exportFormat: 'Csv' | 'Excel')
  exportMembershipPayments: async (exportFormat: string, params: PaymentListParams): Promise<void> => {
    const query = new URLSearchParams();
    if (params.pageNo)     query.append('pageNo',     String(params.pageNo));
    if (params.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params.sortBy)     query.append('sortBy',     params.sortBy);
    params.status?.forEach((s) => query.append('status', s));
    params.membershipTypeUniqueIds?.forEach((id) => query.append('membershipTypeUniqueIds', id));
    params.paymentMethods?.forEach((m) => query.append('paymentMethods', m));
    if (params.invoiceDateFrom) query.append('invoiceDateFrom', params.invoiceDateFrom);
    if (params.invoiceDateTo)   query.append('invoiceDateTo',   params.invoiceDateTo);

    const response = await HttpClient.get(
      `/api/invoice/membership/list/${exportFormat}/export?${query.toString()}`,
      { responseType: 'blob' },
    );

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    const fileExtension = getFileExtension(exportFormat);
    let filename = `Membership_Payments_List_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  getMembershipPaymentSummary: (invoiceId: string) =>
    HttpClient.get<{ data: MembershipPaymentSummary; success: boolean }>(
      `/api/invoice/membership/${invoiceId}/summary`,
    ),

  getMembershipPaymentLineItems: (invoiceId: string) =>
    HttpClient.get<{ data: MembershipPaymentDetailLineItem[]; success: boolean }>(
      `/api/invoice/membership/${invoiceId}/line-items`,
    ),

  getMembershipPaymentNotes: (invoiceId: string) =>
    HttpClient.get<{ data: MembershipPaymentDetailNote[]; success: boolean }>(
      `/api/invoice/${invoiceId}/notes`,
    ),

  addMembershipPaymentNote: (invoiceId: string, note: string) =>
    HttpClient.post<{ data: boolean; success: boolean }>(
      `/api/invoice/${invoiceId}/add-note`,
      { note },
    ),

  // Publicly accessible invoice view (used for the emailed invoice link)
  getMembershipInvoiceView: (invoiceId: string) =>
    HttpClient.get<{ data: MembershipInvoiceView; success: boolean }>(
      `/api/invoice/membership/${invoiceId}/view`,
    ),

  sendMembershipInvoiceEmail: (
    invoiceId: string,
    payload: {
      toEmail: string;
      notifyOrganizer: boolean;
      otherNotificationEmails: string[];
    },
  ) =>
    HttpClient.post<{ success: boolean }>(
      `/api/invoice/membership/${invoiceId}/send-email`,
      payload,
    ),

  // Renders the public invoice view page to a PDF via the screenshot service
  downloadMembershipInvoicePDF: (invoiceId: string) =>
    HttpClient.get(
      `/api/pdf/from-url?url=${encodeURIComponent(`public/membership-invoice/${invoiceId}/view?pdf=true`)}`,
      {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      },
    ),
};

export default membershipPaymentService;
