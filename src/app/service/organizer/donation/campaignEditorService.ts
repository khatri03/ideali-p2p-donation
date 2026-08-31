import HttpClient from "../../httpClient/HttpClient";

export interface Campaign {
  uniqueId: string;
  name: string;
  status: string;
  bannerList: string[];
  goal: {
    goal: number;
    goalAchieved: number;
  };
  invoiceCount: number;
  /** Fundraising pages on this campaign waiting for the charity to approve them. Zero when none are. */
  pendingFundraiserApprovalCount: number;
  startDate: string;
  endDate: string;
  cancellationDateUtc: string | null;
  cancellationNotes: string | null;
}

export interface PlaceHolder {
  uniqueId: string;
  displayText: string;
  placeHolderText: string;
}

export interface PlaceHoldersData {
  donor: PlaceHolder[];
  donation: PlaceHolder[];
  invoice: PlaceHolder[];
  organizer: PlaceHolder[];
  other: PlaceHolder[];
}

export interface PlaceHoldersResponse {
  data: PlaceHoldersData;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: string | null;
  meta: string | null;
  timestamp: string;
}

export interface CampaignListResponse {
  data: {
    pageNo: number;
    pageSize: number;
    pageCount: number;
    totalRecordsCount: number;
    pageData: Campaign[];
  };
  success: boolean;
  message: string | null;
}

// ─── Snippet Types ────────────────────────────────────────────────────────────

export interface SnippetItem {
  uniqueId: string;
  name: string;
  template: string;
  description?: string;
}

export interface CreateSnippetPayload {
  name: string;
  template: string;
  description?: string;
}

export interface UpdateSnippetPayload {
  uniqueId: string;
  name: string;
  template: string;
  description?: string;
}

export interface SnippetResponse {
  data: SnippetItem;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: string | null;
  meta: string | null;
  timestamp: string;
}

export interface SnippetListResponse {
  data: {
    pageNo: number;
    pageSize: number;
    pageCount: number;
    totalRecordsCount: number;
    pageData: SnippetItem[];
  } | SnippetItem[] | null;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: string | null;
  meta: string | null;
  timestamp: string;
}

export interface BaseResponse {
  data: any;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: string | null;
  meta: string | null;
  timestamp: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class campaignEditorService {
  async getCampaignList(
    pageNo: number = 1,
    pageSize: number = 5000,
    searchTerm?: string
  ): Promise<CampaignListResponse> {
    const params: Record<string, any> = { pageNo, pageSize };
    if (searchTerm) params.searchTerm = searchTerm;
    const response = await HttpClient.get('/api/donation/campaign/list', { params });
    return response.data;
  }

  async getEmailPlaceHolders(): Promise<PlaceHoldersResponse> {
    const response = await HttpClient.get('/api/donation/email-template/place-holders');
    return response.data;
  }

  // ── Snippets ───────────────────────────────────────────────────────────────

  /**
   * Fetch all saved snippets.
   * GET /api/donation/email-template/snippet/list
   */
  async getSnippets(pageNo: number = 1, pageSize: number = 1000): Promise<SnippetListResponse> {
    const response = await HttpClient.get('/api/donation/email-template/snippet/list', {
      params: { pageNo, pageSize },
    });
    return response.data;
  }

  /**
   * Create a new snippet.
   * POST /api/donation/email-template/snippet/create
   */
  async createSnippet(payload: CreateSnippetPayload): Promise<SnippetResponse> {
    const response = await HttpClient.post(
      '/api/donation/email-template/snippet/create',
      payload
    );
    return response.data;
  }

  /**
   * Update an existing snippet with new content.
   * POST /api/donation/email-template/snippet/{snippetId}/update
   */
  async updateSnippet(snippetId: string, payload: UpdateSnippetPayload): Promise<SnippetResponse> {
    const response = await HttpClient.post(
      `/api/donation/email-template/snippet/${snippetId}/update`,
      payload
    );
    return response.data;
  }

  /**
   * Delete a snippet.
   * POST /api/donation/email-template/snippet/{snippetId}/delete
   */
  async deleteSnippet(snippetId: string): Promise<BaseResponse> {
    const response = await HttpClient.post(
      `/api/donation/email-template/snippet/${snippetId}/delete`
    );
    return response.data;
  }
}

export default new campaignEditorService();