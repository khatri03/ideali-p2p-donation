export interface OrganizerCampaign {
  campaignUniqueId: string;
  campaignName: string;
  description: string | null;
  organizerUniqueId: string;
  organizerName: string;
  fundRaisingGoal: number;
  startDate: string;
  endDate: string;
  status: string;
  invoiceCount: number;
  bannerList: string[];
  goal: {
    goal: number;
    goalAchieved: number;
  };
}

export interface OrganizerWithCampaigns {
  organizerId: number;
  organizerName: string;
  campaigns: OrganizerCampaign[];
}

export interface DiscoverCampaign {
  campaignId: string;
  campaignName: string;
  organizerName: string;
  imageUrl: string | null;
  category: string;
  description: string | null;
  amountRaised: number;
  goalAmount: number | null;
  progressPercent: number | null;
  donorCount: number;
  endDateUtc: string | null;
  campaignStatus: 'Active' | 'Upcoming' | 'Completed';
  alreadyDonated: boolean;
}

export interface DiscoverCampaignListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: DiscoverCampaign[];
}

export interface DiscoverCampaignApiResponse {
  data: DiscoverCampaignListResponse;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export type CampaignCategory =
  | 'All'
  | 'Environment'
  | 'Animals'
  | 'Education'
  | 'Health'
  | 'Community'
  | 'Religion'
  | 'Humanitarian';

export interface DiscoverFilters {
  search: string;
  category: CampaignCategory;
  sortBy: 'newest' | 'mostRaised' | 'endingSoon' | 'mostDonors';
}
