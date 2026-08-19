export interface Invoice {
  invoiceNo: string;
  InvoiceId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  donorName: string;
  email: string;
  campaignName: string;
  quickBooksInvoiceId: number;
  isMember: boolean;
  memberName: string;
}
