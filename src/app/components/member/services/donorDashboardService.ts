import HttpClient from 'app/service/httpClient/HttpClient';
import {
  DonorDashboardSummary,
  RecentDonationItem,
  SuggestedCampaignsResponse,
} from 'app/interface/memberInter/donorDashboardDto';

const donorDashboardService = {
  async getDashboardSummary(): Promise<DonorDashboardSummary | null> {
    try {
      const response = await HttpClient.get<DonorDashboardSummary>(
        '/api/participant/donation/dashboard-summary',
      );
      return response.data ?? null;
    } catch (error) {
      console.error('Error fetching donor dashboard summary:', error);
      return null;
    }
  },

  async getLatestDonations(): Promise<RecentDonationItem[]> {
    try {
      const response = await HttpClient.get<RecentDonationItem[]>(
        '/api/participant/donation/latest-donations',
      );
      return response.data ?? [];
    } catch (error) {
      console.error('Error fetching latest donations:', error);
      return [];
    }
  },

  async getSuggestedCampaigns(
    pageNo = 1,
    pageSize = 3,
  ): Promise<SuggestedCampaignsResponse | null> {
    try {
      const response = await HttpClient.get<SuggestedCampaignsResponse>(
        '/api/participant/donation/suggested-campaigns',
        { params: { pageNo, pageSize } },
      );
      return response.data ?? null;
    } catch (error) {
      console.error('Error fetching suggested campaigns:', error);
      return null;
    }
  },
};

export default donorDashboardService;
