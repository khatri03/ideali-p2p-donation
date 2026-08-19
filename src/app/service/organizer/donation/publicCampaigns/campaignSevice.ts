import HttpClient from '../../../httpClient/HttpClient';

export interface CampaignGoal {
  goal: number;
  goalAchieved: number;
}

export interface Campaign {
  uniqueId: string;
  name: string;
  bannerList: string[];
  status: 'Draft' | 'Started' | 'Published' | 'Ended' | 'Goal Reached' | string;
  goal: CampaignGoal;
  invoiceCount: number;
  startDate: string;
  endDate: string;
  cancellationDateUtc: string | null;
  cancellationNotes: string | null;
}

export interface CampaignListResponse {
  data: Campaign[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: string | null;
  meta: any | null;
  timestamp: string;
}

const campaignService = {
  /**
   * Fetch the full campaign list for a given organizer.
   * GET /api/organizer/{organizerId}/campaign-list
   */
  getCampaignList: async (organizerUniqueId: string): Promise<CampaignListResponse> => {
    const idToUse = organizerUniqueId || localStorage.getItem('organizerUniqueId');

    if (!idToUse || idToUse === 'undefined' || idToUse === 'null') {
      throw new Error('Organizer ID not found. Please log in again.');
    }

    const response = await HttpClient.get(`/api/organizer/${idToUse}/campaign-list`);
    return response.data;
  },

  /**
   * Fetches banner image with auth headers and returns a blob object URL.
   */
  getBannerImageBlob: async (bannerId: string): Promise<string> => {
    const response = await HttpClient.get(`/api/images/${bannerId}.png`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },
};

export default campaignService;