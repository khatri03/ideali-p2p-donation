import HttpClient from 'app/service/httpClient/HttpClient';
import {
  DonorDonationListResponse,
  RecurringDonationRecord,
  DonorDonationRecord,
  DonationHistoryResponse,
} from 'app/interface/memberInter/donorDonationDto';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errorCode: string | null;
}

const donorDonationService = {
  async getDonationHistory(
    pageNo: number,
    pageSize: number,
    searchTerm?: string,
  ): Promise<DonorDonationListResponse | null> {
    try {
      const params: Record<string, any> = { pageNo, pageSize };
      if (searchTerm) params.searchTerm = searchTerm;
      const response = await HttpClient.get<ApiResponse<DonorDonationListResponse>>(
        '/api/member/me/donations',
        { params },
      );
      if (response.data.success) return response.data.data;
      return null;
    } catch (error) {
      console.error('Error fetching donation history:', error);
      return null;
    }
  },

  async getRecurringDonations(): Promise<RecurringDonationRecord[]> {
    try {
      const response = await HttpClient.get<ApiResponse<RecurringDonationRecord[]>>(
        '/api/member/me/recurring-donations',
      );
      if (response.data.success) return response.data.data;
      return [];
    } catch (error) {
      console.error('Error fetching recurring donations:', error);
      return [];
    }
  },

  async getDonationDetail(invoiceId: string): Promise<DonorDonationRecord | null> {
    try {
      const response = await HttpClient.get<ApiResponse<DonorDonationRecord>>(
        `/api/member/me/donations/${invoiceId}`,
      );
      if (response.data.success) return response.data.data;
      return null;
    } catch (error) {
      console.error('Error fetching donation detail:', error);
      return null;
    }
  },

  async cancelRecurringDonation(subscriptionId: string): Promise<boolean> {
    try {
      const response = await HttpClient.post<ApiResponse<null>>(
        `/api/member/me/recurring-donations/${subscriptionId}/cancel`,
      );
      return response.data.success;
    } catch (error) {
      console.error('Error cancelling recurring donation:', error);
      return false;
    }
  },

  async fetchDonationHistory(
    pageNumber: number,
    pageSize: number,
    params?: Record<string, string>,
  ): Promise<DonationHistoryResponse | null> {
    try {
      const response = await HttpClient.get<DonationHistoryResponse>(
        '/api/participant/donation/donation-history',
        { params: { pageNumber, pageSize, ...params } },
      );
      return response.data ?? null;
    } catch (error) {
      console.error('Error fetching donation history:', error);
      return null;
    }
  },
};

export default donorDonationService;
