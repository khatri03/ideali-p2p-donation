import HttpClient from 'app/service/httpClient/HttpClient';

export interface ProgressStats {
  paymentAccountCreated: boolean;
  campaignCreated: boolean;
  campaignPublished: boolean;
}

interface ProgressStatsResponse {
  data: ProgressStats;
  success: boolean;
  message: string | null;
  errorCode: string | null;
}

const progressStatsService = {
  async getProgressStats(): Promise<ProgressStats | null> {
    try {
      const response = await HttpClient.get<ProgressStatsResponse>(
        '/api/organizer/me/progress-stats'
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      return null;
    }
  },
};

export default progressStatsService;
