import HttpClient from '../httpClient/HttpClient';

export interface OrganizerModule {
  organizerUniqueId: string;
  emailAddress: string;
  uniqueId: string;
  name: string;
  modules: string[];
  status: string;
}

export interface OrganizerListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: OrganizerModule[];
}

export interface ShortNameAvailabilityResponse {
  data: boolean;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

class AdminService {
  /**
   * Fetch list of active organizers
   * @param pageIndex - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 50)
   * @returns Promise with organizer list response
   */
  async getActiveOrganizers(
    pageIndex: number = 1,
    pageSize: number = 50
  ): Promise<OrganizerListResponse> {
    try {
      const response = await HttpClient.get(
        `/api/admin/organizer/list/?pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      console.log('Active Organizers Response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching active organizers:', error);
      throw error;
    }
  }

  /**
   * Check if a short name (subdomain) is available
   * @param shortName - The short name to check
   * @returns Promise with availability response
   */
  async checkShortNameAvailability(
    shortName: string
  ): Promise<ShortNameAvailabilityResponse> {
    try {
      const response = await HttpClient.get(
        `/api/admin/organizer/sub-domain/check-availability?shortName=${encodeURIComponent(shortName)}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error checking short name availability:', error);
      throw error;
    }
  }

  /**
   * Upload logo for an organizer
   * @param organizerId - The ID of the organizer
   * @param logo - The logo file to upload
   * @returns Promise with valid response
   */
  async uploadLogo(organizerId: string, logo: File): Promise<any> {
    const formData = new FormData();
    formData.append('logo', logo);

    try {
      const response = await HttpClient.post(
        `/api/admin/organizer/${organizerId}/upload-logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }
}

export default new AdminService();
