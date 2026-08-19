import HttpClient from 'app/service/httpClient/HttpClient';
import {
  PlaceHoldersResponse,
  SnippetListResponse,
  SnippetResponse,
  BaseResponse,
  CreateSnippetPayload,
  UpdateSnippetPayload,
} from 'app/service/organizer/donation/campaignEditorService';

class MembershipEmailTemplateService {
  async getEmailPlaceHolders(): Promise<PlaceHoldersResponse> {
    const response = await HttpClient.get(
      '/api/organizer/membership/type/email-template/place-holders',
    );
    return response.data;
  }

  async getSnippets(pageNo: number = 1, pageSize: number = 1000): Promise<SnippetListResponse> {
    const response = await HttpClient.get(
      '/api/organizer/membership/type/email-template/snippet/list',
      { params: { pageNo, pageSize } },
    );
    return response.data;
  }

  async createSnippet(payload: CreateSnippetPayload): Promise<SnippetResponse> {
    const response = await HttpClient.post(
      '/api/organizer/membership/type/email-template/snippet/create',
      payload,
    );
    return response.data;
  }

  async updateSnippet(snippetId: string, payload: UpdateSnippetPayload): Promise<SnippetResponse> {
    const response = await HttpClient.post(
      `/api/organizer/membership/type/email-template/snippet/${snippetId}/update`,
      payload,
    );
    return response.data;
  }

  async deleteSnippet(snippetId: string): Promise<BaseResponse> {
    const response = await HttpClient.post(
      `/api/organizer/membership/type/email-template/snippet/${snippetId}/delete`,
    );
    return response.data;
  }
}

export default new MembershipEmailTemplateService();
