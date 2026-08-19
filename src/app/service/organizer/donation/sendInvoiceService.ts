import HttpClient from '../../httpClient/HttpClient';

/**
 * Response interface for send invoice API
 */
interface SendInvoiceResponse {
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

/**
 * Service for managing invoice operations
 */
class sendInvoiceService {
  /**
   * Send invoice via email
   * @param invoiceUniqueId - The unique identifier of the invoice
   * @returns Promise with response data
   */
  static async sendInvoice(invoiceUniqueId: string): Promise<SendInvoiceResponse> {
    try {
      const response = await HttpClient.get<SendInvoiceResponse>(
        `/api/invoice/donation/${invoiceUniqueId}/re-send`
      );

      if (response.status === 200 && response.data.success) {
        return response.data;
      }

      throw new Error(response.statusText || 'Failed to send invoice');
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to send invoice'
      );
    }
  }
}

export default sendInvoiceService;