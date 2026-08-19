import axios from 'axios';
import HttpClient from '../../httpClient/HttpClient';
import { Invoice } from 'app/interface/donationInter/invoiceListDto';
import paymentAccountService from './paymentAccountService';

export interface InvoiceResponse {
  invoices: Invoice[];
  totalRecords: number;
}

export interface FetchInvoicesParams {
  campaignId?: string;
  status?: string;
  searchTerm?: string;
  memberFilter?: string;
  pageNo: number;
  pageSize: number;
}

export interface Note {
  author: string;
  date: string;
  text: string;
}

/**
 * Updated InvoiceService.ts - with Status Filter Support
 */

/**
 * Fetch paid invoices with optional campaign, status, and search filtering
 * @param params - Parameters for fetching invoices
 * @returns Promise with transformed invoices and total count
 */
export const fetchPaidInvoices = async (
  params: FetchInvoicesParams,
): Promise<InvoiceResponse> => {
  const { campaignId, status, searchTerm, memberFilter, pageNo, pageSize } =
    params;

  try {
    let url: string;
    const queryParams: Record<string, string | number> = {
      pageNo,
      pageSize,
    };

    // Determine the appropriate endpoint based on parameters
    if (campaignId && campaignId.trim() !== '' && campaignId !== 'undefined') {
      // Campaign-specific endpoint
      url = `/api/invoice/donation/${campaignId}/list/paid`;
    } else if (searchTerm !== undefined) {
      // Search-based endpoint (for dropdown filtering)
      url = `/api/invoice/donation/list/paid`;
      queryParams.searchTerm = searchTerm;
    } else {
      // Default endpoint
      url = `/api/invoice/donation/list/paid`;
    }

    // NEW: Add status filter if provided
    if (status && status.trim() !== '') {
      queryParams.status = status;
    }

    // Add member filter if provided (Members / NonMembers)
    if (memberFilter && memberFilter.trim() !== '') {
      queryParams.memberFilter = memberFilter;
    }

    // Build query string
    const queryString = new URLSearchParams(
      Object.entries(queryParams).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    const fullUrl = `${url}?${queryString}`;

    console.log('Fetching invoices from:', fullUrl);

    const response = await HttpClient.get(fullUrl);
    const apiData = response.data?.data || response.data || response;
    const invoiceList = apiData.pageData || [];

    // Transform the API response to match the Invoice interface
    const transformedInvoices: Invoice[] = invoiceList.map((item: any) => ({
      invoiceNo: item.invoiceNo || item.invoiceNumber || item.invoice_no || '-',
      date: item.invoiceDateUtc || '-',
      amount: item.amount || 0,
      campaignName: item.campaignName || '-',
      donorName:
        item.contact?.firstName && item.contact?.lastName
          ? `${item.contact.firstName} ${item.contact.lastName}`.trim()
          : item.contact?.firstName || item.contact?.lastName || '-',
      email: item.contact?.primaryEmail || item.contact?.secondaryEmail || '-',
      InvoiceId: item.invoiceId || '',
      status: item.status || '',
      paymentMethod: item.paymentMethod || '',
      quickBooksInvoiceId: item.quickBooksInvoiceId || null,
      paymentStatus: item.paymentStatus || null,
      isMember: !!item.isMember,
      memberName: item.memberName || '-',
    }));

    return {
      invoices: transformedInvoices,
      totalRecords: apiData.totalRecordsCount || invoiceList.length || 0,
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error; // Re-throw to let the component handle the error
  }
};

export default {
  fetchPaidInvoices,
};

/**
 * Fetch all paid invoices (without campaign filter)
 * @param pageNo - Page number
 * @param pageSize - Number of items per page
 * @returns Promise with transformed invoices and total count
 */
export const fetchAllPaidInvoices = async (
  pageNo: number,
  pageSize: number,
): Promise<InvoiceResponse> => {
  return fetchPaidInvoices({ pageNo, pageSize });
};

/**
 * Fetch paid invoices for a specific campaign
 * @param campaignId - Campaign identifier
 * @param pageNo - Page number
 * @param pageSize - Number of items per page
 * @returns Promise with transformed invoices and total count
 */
export const fetchCampaignInvoices = async (
  campaignId: string,
  pageNo: number,
  pageSize: number,
): Promise<InvoiceResponse> => {
  return fetchPaidInvoices({ campaignId, pageNo, pageSize });
};
/**
 * Invoice detail interface matching the API response
 */
export interface InvoiceDetailResponse {
  contact: {
    prefix: number;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: number;
    maritalStatus: number;
    ssn: string | null;
    dob: string | null;
    primaryEmail: string | null;
    secondaryEmail: string | null;
    workEmail: string | null;
    cellPhone: string | null;
    workPhone: string | null;
    homePhone: string | null;
    address: {
      streetLine1: string | null;
      streetLine2: string | null;
      zipCode: string | null;
    };
  };
  isMember: boolean;
  uniqueId: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
  invoiceStatus: string;
  invoiceType: string;
  balanceAmount: number | null;
  taxAmount: number | null;
  serviceCharges: number | null;
  discountAmount: number;
  invoiceContext: {
    module: string;
    uniqueId: string;
    name: string;
    isMemberInvoice: boolean;
  };
  invoiceItems: Array<{
    description: string;
    unitPrice: number;
    quantity: number;
    total: number;
    invoiceItemStatus: string;
    taxCharges: {
      description: string | null;
      amount: number | null;
    };
    serviceCharges: {
      description: string | null;
      amount: number | null;
    };
  }>;
  notes: Array<{
    author: string;
    date: string;
    text: string;
  }>;
  payments: Array<{
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    referenceNo: string;
    note: string | null;
    paymentDateUtc: string;
    createdBy: string;
    createdOnUtc: string;
  }>;
}

/**
 * Fetch invoice details by unique ID
 * @param uniqueId - Invoice unique identifier
 * @returns Promise with invoice detail data
 */
export const fetchInvoiceDetail = async (
  uniqueId: string,
): Promise<InvoiceDetailResponse> => {
  try {
    const url = `/api/invoice/donation/${uniqueId}/detail`;
    const response = await HttpClient.get(url);

    // Extract the data from the response structure
    const invoiceData = response.data?.data || response.data || response;

    return invoiceData;
  } catch (error) {
    console.error('Error fetching invoice detail:', error);
    throw error;
  }
};

/**
 * Fetches invoice detail by unique ID (Public - no auth required)
 * @param uniqueId - Invoice unique identifier
 * @returns Promise with invoice detail data
 */
export const fetchPublicInvoiceDetail = async (
  uniqueId: string,
): Promise<InvoiceDetailResponse> => {
  try {
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/invoice/${uniqueId}/view`;
    const response = await axios.get(url);

    // Extract the data from the response structure
    const invoiceData = response.data?.data || response.data || response;

    return invoiceData;
  } catch (error) {
    console.error('Error fetching public invoice detail:', error);
    throw error;
  }
};

/**
 * Download invoice PDF by unique ID (Public - no auth required)
 * @param uniqueId - Invoice unique identifier
 * @returns Promise with PDF blob
 */
export const downloadPublicInvoicePDF = async (
  uniqueId: string,
): Promise<Blob> => {
  try {
    // Add ?pdf=true to hide the download button in the screenshot
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/pdf/from-url?url=${encodeURIComponent(`invoice/${uniqueId}?pdf=true`)}`;

    console.log('Fetching PDF from URL:', url);

    const response = await axios.get(url, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error downloading invoice PDF:', error);
    console.error('Error response:', error.response);

    if (error.response?.status === 404) {
      throw new Error('Invoice not found or PDF endpoint unavailable');
    }
    throw new Error(
      error.response?.data?.message ||
        'Failed to download invoice PDF. Please try again.',
    );
  }
};

/**
 * Download invoice PDF by unique ID (Authenticated)
 * @param uniqueId - Invoice unique identifier
 * @returns Promise with PDF blob
 */
export const downloadInvoicePDF = async (uniqueId: string): Promise<Blob> => {
  try {
    // Add ?pdf=true to hide the download button in the screenshot
    const url = `/api/pdf/from-url?url=${encodeURIComponent(`invoice/${uniqueId}?pdf=true`)}`;

    console.log('Fetching PDF from URL:', url);

    const response = await HttpClient.get(url, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error downloading invoice PDF:', error);

    if (error.response?.status === 404) {
      throw new Error('Invoice not found or PDF endpoint unavailable');
    }
    throw new Error('Failed to download invoice PDF. Please try again.');
  }
};
