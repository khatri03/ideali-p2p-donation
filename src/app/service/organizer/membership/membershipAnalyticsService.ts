import HttpClient from 'app/service/httpClient/HttpClient';

export interface ActiveMembersResponse {
  data: number;
  success: boolean;
  message: string | null;
}

export interface MonthlyRevenueData {
  totalRevenue: number;
  paidInvoicesCount: number;
  month: number;
  year: number;
}

export interface MonthlyRevenueResponse {
  data: MonthlyRevenueData;
  success: boolean;
  message: string | null;
}

export interface DistributionSlice {
  name: string;
  count: number;
}

export interface MembershipDistributionData {
  slices: DistributionSlice[];
  totalCount: number;
}

interface MembershipDistributionResponse {
  data: MembershipDistributionData;
  success: boolean;
  message: string | null;
}

const membershipAnalyticsService = {
  async getActiveMembersCount(): Promise<number | null> {
    try {
      const response = await HttpClient.get<ActiveMembersResponse>(
        '/api/organizer/membership-dashboard/analytics/active-members-count'
      );
      if (response.data.success) return response.data.data;
      return null;
    } catch {
      return null;
    }
  },

  async getCurrentMonthRevenue(): Promise<MonthlyRevenueData | null> {
    try {
      const response = await HttpClient.get<MonthlyRevenueResponse>(
        '/api/organizer/membership-dashboard/analytics/current-month-revenue'
      );
      if (response.data.success) return response.data.data;
      return null;
    } catch {
      return null;
    }
  },

  async getLastMonthRevenue(): Promise<MonthlyRevenueData | null> {
    try {
      const response = await HttpClient.get<MonthlyRevenueResponse>(
        '/api/organizer/membership-dashboard/analytics/last-month-revenue'
      );
      if (response.data.success) return response.data.data;
      return null;
    } catch {
      return null;
    }
  },

  async getMembershipDistribution(): Promise<MembershipDistributionData | null> {
    try {
      const response = await HttpClient.get<MembershipDistributionResponse>(
        '/api/organizer/membership-dashboard/analytics/membership-distribution'
      );
      if (response.data.success) return response.data.data;
      return null;
    } catch {
      return null;
    }
  },
};

export default membershipAnalyticsService;
