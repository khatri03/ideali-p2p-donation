import HttpClient from 'app/service/httpClient/HttpClient';

export interface ProfileResponse {
  contactUniqueId?: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  primaryEmail: string;
  phoneNo: string;
  country?: string;
  city?: string;
  state?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  primaryEmail: string;
  phoneNo: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

const donorProfileService = {
  async getProfile(): Promise<ProfileResponse | null> {
    try {
      const response = await HttpClient.get<{ data?: ProfileResponse } & Partial<ProfileResponse>>(
        '/api/participant/donation/profile',
      );
      // Backend sometimes wraps the profile in a `data` envelope and sometimes
      // returns it directly — unwrap defensively either way.
      const payload = response.data as any;
      const profile: ProfileResponse | undefined = payload?.data ?? payload;
      return profile ?? null;
    } catch (error) {
      console.error('Error fetching donor profile:', error);
      return null;
    }
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<{ success: boolean; message: string | null }> {
    const response = await HttpClient.put<{ success: boolean; message: string | null }>(
      '/api/participant/donation/profile',
      payload,
    );
    return response.data;
  },
};

export default donorProfileService;
