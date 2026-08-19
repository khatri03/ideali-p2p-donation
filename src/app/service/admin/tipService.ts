import HttpClient from '../httpClient/HttpClient';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface OrganizerSummary {
  organizerUniqueId: string;
  organizerName: string;
  totalTipAmount: number;
  campaignCount: number;
}


export interface OrganizerSummaryResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: OrganizerSummary[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface TipReportQueryParams {
  organizerUniqueIds?: string[];
  searchTerm?: string;
  pageNo?: number;
  pageSize?: number;
}

// ─── Campaign summary interfaces (flat response from POST) ────────────────────

/** Single row as returned by POST /api/admin/tip/organizer/campaigns/summary */
export interface CampaignSummaryRow {
  organizerUniqueId: string;
  organizerName: string;
  campaignId: number;
  campaignUniqueId: string;
  campaignName: string;
  totalTipAmount: number;
}

export interface CampaignSummaryFlatResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: CampaignSummaryRow[];
}

export interface CampaignSummaryRequestBody {
  organizerUniqueIds: string[];
  searchTerm?: string;
  pageNo?: number;
  pageSize?: number;
}

// ─── Grouped shape used by the UI ─────────────────────────────────────────────

export interface GroupedOrganizerReport {
  organizerUniqueId: string;
  organizerName: string;
  totalTipAmount: number;
  campaigns: {
    campaignId: number;
    campaignUniqueId: string;
    campaignName: string;
    totalTipAmount: number;
  }[];
}
// Campaign donor summary interfaces
export interface CampaignDonorRow {
  invoiceUniqueId: string;
  invoiceNo: string;
  invoiceStatus: string;
  contactUniqueId: string;
  contactName: string;
  memberUniqueId: string | null;
  memberName: string | null;
  tipAmount: number;
  createdOnUtc: string;
}
 
export interface CampaignDonorSummaryResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: CampaignDonorRow[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

class TipReportService {
  /**
   * Fetch organizer list for the dropdown.
   * Endpoint: GET /api/admin/tip/organizers/summary
   */
  async getOrganizersForDropdown(
    searchTerm?: string,
    pageNo: number = 1,
    pageSize: number = 1000
  ): Promise<OrganizerSummary[]> {
    try {
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.append('searchTerm', searchTerm.trim());
      }
      params.append('pageNo', String(pageNo));
      params.append('pageSize', String(pageSize));

      const response = await HttpClient.get<ApiResponse<OrganizerSummaryResponse>>(
        `/api/admin/tip/organizers/summary?${params.toString()}`
      );

      console.log('Tip Organizers Summary Response:', response.data);
      return response.data?.data?.pageData ?? [];
    } catch (error: any) {
      console.error('Error fetching tip organizers:', error);
      throw error;
    }
  }

  /**
   * Fetch campaign-level tip summary for selected organizers.
   * Endpoint: GET /api/admin/tip/organizer/campaigns/summary
   */
  async getOrganizerCampaignSummary(params: TipReportQueryParams = {}) {
    const {
      organizerUniqueIds = [],
      searchTerm,
      pageNo = 1,
      pageSize = 100,
    } = params;

    try {
      const queryParams = new URLSearchParams();
      organizerUniqueIds.forEach((id) => queryParams.append('organizerUniqueIds', id));
      if (searchTerm) queryParams.append('searchTerm', searchTerm);
      queryParams.append('pageNo', String(pageNo));
      queryParams.append('pageSize', String(pageSize));

      const response = await HttpClient.get(
        `/api/admin/tip/organizer/campaigns/summary?${queryParams.toString()}`
      );

      return response.data?.data ?? response.data;
    } catch (error: any) {
      console.error('Error fetching organizer campaign summary:', error);
      throw error;
    }
  }

  /**
   * Fetch per-organizer campaign tip breakdown for the report view.
   * Endpoint: POST /api/admin/tip/organizer/campaigns/summary
   * Returns flat list — grouped by organizerUniqueId on the client.
   */
  async getOrganizerCampaignReport(
    body: CampaignSummaryRequestBody
  ): Promise<GroupedOrganizerReport[]> {
    try {
      const requestBody = {
        organizerUniqueIds: body.organizerUniqueIds,
        searchTerm: body.searchTerm ?? '',
        pageNo: body.pageNo ?? 1,
        pageSize: body.pageSize ?? 100,
      };

      const response = await HttpClient.post<ApiResponse<CampaignSummaryFlatResponse>>(
        `/api/admin/tip/organizer/campaigns/summary`,
        requestBody
      );

      console.log('Organizer Campaign Report Response:', response.data);

      const rows: CampaignSummaryRow[] = response.data?.data?.pageData ?? [];

      // ── Group flat rows by organizerUniqueId ──────────────────────────────
      const map = new Map<string, GroupedOrganizerReport>();

      rows.forEach((row) => {
        if (!map.has(row.organizerUniqueId)) {
          map.set(row.organizerUniqueId, {
            organizerUniqueId: row.organizerUniqueId,
            organizerName: row.organizerName,
            totalTipAmount: 0,
            campaigns: [],
          });
        }

        const group = map.get(row.organizerUniqueId)!;
        group.campaigns.push({
          campaignId: row.campaignId,
          campaignUniqueId: row.campaignUniqueId,
          campaignName: row.campaignName,
          totalTipAmount: row.totalTipAmount,
        });
        group.totalTipAmount += row.totalTipAmount;
      });

      return Array.from(map.values());
    } catch (error: any) {
      console.error('Error fetching organizer campaign report:', error);
      throw error;
    }
  }

   async getCampaignDonorSummary(
    campaignUniqueId: string,
    searchTerm?: string,
    pageNo: number = 1,
    pageSize: number = 50
  ): Promise<CampaignDonorSummaryResponse> {
    try {
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.append('searchTerm', searchTerm.trim());
      }
      params.append('pageNo', String(pageNo));
      params.append('pageSize', String(pageSize));
 
      const response = await HttpClient.get<ApiResponse<CampaignDonorSummaryResponse>>(
        `/api/admin/tip/donation-campaign/${campaignUniqueId}/summary?${params.toString()}`
      );
 
      console.log('Campaign Donor Summary Response:', response.data);
      return response.data?.data ?? { pageNo, pageSize, pageCount: 0, totalRecordsCount: 0, pageData: [] };
    } catch (error: any) {
      console.error('Error fetching campaign donor summary:', error);
      throw error;
    }
  }
}

export default new TipReportService();