import HttpClient from 'app/service/httpClient/HttpClient';
import { OrganizerWithCampaigns } from 'app/interface/memberInter/discoverCampaignDto';

const discoverService = {
  async getOrganizerCampaigns(): Promise<OrganizerWithCampaigns[]> {
    try {
      const response = await HttpClient.get<OrganizerWithCampaigns[]>(
        '/api/participant/donation/organizer-other-campaigns',
      );
      return response.data ?? [];
    } catch (error) {
      console.error('Error fetching organizer campaigns:', error);
      return [];
    }
  },

  async getBannerImageBlob(bannerId: string): Promise<string> {
    const bannerUrl = `/api/images/${bannerId}.png`;
    const response = await HttpClient.get(bannerUrl, { responseType: 'blob' });
    const blob = new Blob([response.data], {
      type: (response.headers['content-type'] as string) || 'image/png',
    });
    return URL.createObjectURL(blob);
  },
};

export default discoverService;
