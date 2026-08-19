import HttpClient from 'app/service/httpClient/HttpClient';

export interface QuickbooksAuthUrlResponse {
  data: string;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: string | null;
  meta: null;
  timestamp: string;
}

export interface QuickbooksCallbackResponse {
  success: boolean;
  message?: string | null;
}
export interface QuickbooksStatusData {
  uniqueId: string;
  connectedAtUtc: string;
  isConnected: boolean;
  name: string;
}

export interface QuickbooksStatusResponse {
  data: QuickbooksStatusData;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: string | null;
}

export interface QuickbooksSyncResponse {
  success: boolean;
  message?: string | null;
  error?: string;
}

class QuickbooksService {
  private readonly AUTH_URL_ENDPOINT = '/quickbooks/integration/qb-auth-url';
  private readonly CALLBACK_ENDPOINT = '/quickbooks/integration/callback';
  private readonly STATUS_ENDPOINT = '/quickbooks/integration/qb-status';
  private readonly SYNC_ENDPOINT = '/quickbooks/integration/qb-invoice-sync';

  async getAuthUrl(returnUrl: string, state: string): Promise<string> {
    const response = await HttpClient.get<QuickbooksAuthUrlResponse>(
      this.AUTH_URL_ENDPOINT,
      { params: { returnUrl, state } },
    );
    console.log('Quickbooks auth URL response:', response.data);
    return response.data.data;
  }

  async handleCallback(
    code: string,
    state: string,
    realmId: string,
    redirectUri: string,
  ): Promise<QuickbooksCallbackResponse> {
    const response = await HttpClient.get<QuickbooksCallbackResponse>(
      this.CALLBACK_ENDPOINT,
      { params: { code, state, realmId, redirectUri } },
    );
    return response.data;
  }
  async getQbStatus(): Promise<boolean> {
    const response = await HttpClient.get<QuickbooksStatusResponse>(
      this.STATUS_ENDPOINT,
    );
    return response.data?.data?.isConnected === true;
  }

  async syncInvoices(invoiceIds: string[]): Promise<QuickbooksSyncResponse> {
    const response = await HttpClient.post<QuickbooksSyncResponse>(
      this.SYNC_ENDPOINT,
      { invoiceIds },
    );
    console.log('Quickbooks sync response:', response.data);

    return response.data;
  }
}

export default new QuickbooksService();
