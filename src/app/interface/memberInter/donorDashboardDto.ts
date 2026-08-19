export interface DonorDashboardSummary {
  contactUniqueId: string;
  lifetimeTotalDonations: number;
  lifetimeTotalDonationAmount: number;
  currentYearTotalDonations: number;
  currentYearTotalDonationAmount: number;
  totalDonationCampaigns: number;
  totalOrganizers: number;
}

export interface RecentDonationItem {
  donationCampaignUniqueId: string;
  campaignName: string;
  campaignDescription: string;
  invoiceUniqueId: string;
  invoiceNo: string;
  donationAmount: number;
  tipAmount: number;
  donationDateUtc: string;
  organizerId: number;
  organizerName: string;
}

export interface SuggestedCampaignItem {
  campaignUniqueId: string;
  campaignName: string;
  description: string | null;
  organizerId: number;
  organizerName: string;
  fundRaisingGoal: number;
  startDate: string;
  endDate: string;
}

export interface SuggestedCampaignsResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: SuggestedCampaignItem[];
}
