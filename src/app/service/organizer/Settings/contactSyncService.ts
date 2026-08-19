import HttpClient from 'app/service/httpClient/HttpClient';

export interface AvailableIntegration {
  value: number;
  text: string;
}
export interface ConnectResponse {
  success: boolean;
  message?: string;
}

export interface AuthUrlResponse {
  authUrl: string;
}
export interface ConnectedIntegration {
  uniqueId: string;
  name: string;
  provider: string;
  lastConnectedUtc: string;
}
export interface IntegrationList {
  list_id: string;
  name: string;
  membership_count: number;
}

class contactSyncService {
  async getAvailableIntegrations(): Promise<AvailableIntegration[]> {
    const response = await HttpClient.get<AvailableIntegration[]>(
      '/api/organizer/contact-sync/integration/available-integrations',
    );
    return response.data;
  }

  async getAuthUrl(
    provider: number,
    returnUrl: string,
    state: string,
  ): Promise<AuthUrlResponse> {
    const response = await HttpClient.get<AuthUrlResponse>(
      '/api/organizer/contact-sync/integration/auth-url',
      { params: { provider, returnUrl, state } },
    );
    return response.data;
  }

  async connectIntegration(
    provider: number,
    code: string,
    redirectUrl: string,
  ): Promise<ConnectResponse> {
    const response = await HttpClient.post<ConnectResponse>(
      '/api/organizer/contact-sync/integration/connect',
      null,
      { params: { provider, code, redirectUrl } },
    );
    return response.data;
  }

  async getConnectedItems(): Promise<ConnectedIntegration[]> {
    const response = await HttpClient.get<{ data: ConnectedIntegration[] }>(
      '/api/organizer/contact-sync/integration/connected-items',
    );
    return response.data.data;
  }

  async getIntegrationListItems(
    integrationUniqueId: string,
  ): Promise<IntegrationList[]> {
    const response = await HttpClient.get<{
      data: { lists: IntegrationList[] };
    }>(
      `/api/organizer/contact-sync/integration/${integrationUniqueId}/list-items`,
    );
    return response.data.data.lists;
  }

  async createIntegrationListItem(
    integrationUniqueId: string,
    contactListName: string,
  ): Promise<void> {
    await HttpClient.post(
      `/api/organizer/contact-sync/integration/${integrationUniqueId}/list-items/create`,
      null,
      { params: { contactListName } },
    );
  }

  async queueManualSync(
    orgProviderId: string,
    providerListId: string,
    contactIds: string[],
  ): Promise<void> {
    await HttpClient.post(
      '/api/organizer/contact-sync/integration/queue-manually',
      {
        module: 'Donation',
        orgProviderId: orgProviderId,
        providerListId: providerListId,
        contactIds: contactIds,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

export default new contactSyncService();
