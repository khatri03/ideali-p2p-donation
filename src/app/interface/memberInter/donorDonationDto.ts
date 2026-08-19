export interface DonationHistoryRecord {
  invoiceUniqueId: string;
  receiptNo: string;
  campaignUniqueId: string;
  campaignName: string;
  organizerId: number;
  organizerName: string;
  amount: number;
  tipAmount: number;
  currency: string | null;
  paymentStatus: string;
  paymentMethod: string;
  donationDateUtc: string;
}

export interface DonationHistoryResponse {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  records: DonationHistoryRecord[];
}

export interface DonationHistoryFilters {
  dateRange: '90' | 'all' | 'year';
  organizerName: string;
  paymentMethod: string;
}

export interface DonorDonationRecord {
  invoiceId: string;
  invoiceNo: string;
  campaignId: string;
  campaignName: string;
  campaignImageUrl: string | null;
  organizerName: string;
  donationDateUtc: string;
  amount: number;
  tipAmount: number;
  frequency: 'OneTime' | 'Monthly' | 'Yearly';
  paymentMethod: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  receiptUrl: string | null;
}

export interface DonorDonationListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: DonorDonationRecord[];
}

export interface DonorDonationListApiResponse {
  data: DonorDonationListResponse;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface RecurringDonationRecord {
  subscriptionId: string;
  campaignId: string;
  campaignName: string;
  campaignImageUrl: string | null;
  organizerName: string;
  amount: number;
  frequency: 'Monthly' | 'Yearly';
  nextPaymentDateUtc: string;
  startedDateUtc: string;
  status: 'Active' | 'Paused' | 'Cancelled';
}

export interface RecurringDonationsResponse {
  data: RecurringDonationRecord[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface DonationDetailResponse {
  data: DonorDonationRecord;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}
