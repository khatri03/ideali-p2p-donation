import HttpClient from '../httpClient/HttpClient';

export interface CreateSubProfileRequest {
  name: string;
  description: string;
}

export interface SubProfileResponse {
  data: any;
  success: boolean;
  message: string | null;
  
}

class SubProfileService {
  async createSubProfile(payload: CreateSubProfileRequest): Promise<SubProfileResponse> {
    const response = await HttpClient.post('/api/organizer/sub-profile/create', payload);
    return response.data;
  }

  async getSubProfiles(): Promise<SubProfileResponse> {
    const response = await HttpClient.get('/api/organizer/sub-profile/list');
    return response.data;
  }

  async switchSubProfile(subProfileUniqueId: string): Promise<SubProfileResponse> {
    console.log('[SubProfileService] switchSubProfile called with:', subProfileUniqueId);
    console.log('[SubProfileService] URL:', `/api/organizer/sub-profile/set/${subProfileUniqueId}`);
    const response = await HttpClient.post(`/api/organizer/sub-profile/set/${subProfileUniqueId}`, {});
    console.log('[SubProfileService] switchSubProfile response:', response.data);
    return response.data;
  }

  async setDefaultSubProfile(): Promise<SubProfileResponse> {
    const response = await HttpClient.post('/api/organizer/sub-profile/set/default', {});
    return response.data;
  }

  async getSubProfileDetail(subProfileUniqueId: string): Promise<SubProfileResponse> {
    const response = await HttpClient.get(`/api/organizer/sub-profile/${subProfileUniqueId}/detail`);
    return response.data;
  }

  async updateSubProfile(subProfileUniqueId: string, payload: { name: string; description: string }): Promise<SubProfileResponse> {
    const response = await HttpClient.post(`/api/organizer/sub-profile/${subProfileUniqueId}/update`, payload);
    return response.data;
  }
}

export default new SubProfileService();
