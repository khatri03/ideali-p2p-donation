import HttpClient from 'app/service/httpClient/HttpClient'; // Adjust path as needed

// Interfaces
export interface DonorData {
  campaignInfo: {
    id: string;
    name: string;
  };
  invoiceInfo: {
    uniqueId : string;
    invoiceNo: string;
    invoiceDateUtc: string;
    invoiceAmount: number;
  };
  contact: {
    uniqueId: string;
    prefix: number;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: number;
    maritalStatus: number;
    ssn: string | null;
    dob: string | null;
    primaryEmail: string | null;
    secondaryEmail: string | null;
    workEmail: string | null;
    cellPhone: string | null;
    workPhone: string | null;
    homePhone: string | null;
    address: {
      streetLine1: string | null;
      streetLine2: string | null;
      zipCode: string | null;
    };
  };
}

export interface DonorListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: DonorData[];
}

interface ApiResponse<T> {
  data: T;
}

// Donor Service Class
class DonorService {
  private baseUrl = '/api/donation/campaign';

  /**
   * Fetch donor list with pagination
   * @param pageNo - Page number (starting from 1)
   * @param pageSize - Number of items per page
   * @param campaignUniqueId - Optional campaign unique ID to filter donors
   * @returns Promise with donor list response
   */
  async getDonorList(
    pageNo: number = 1, 
    pageSize: number = 50, 
    campaignUniqueId?: string
  ): Promise<DonorListResponse> {
    try {
      let url = '';
      
      if (campaignUniqueId) {
        // For specific campaign
        url = `/api/donation/campaign/${campaignUniqueId}/donor-list?pageNo=${pageNo}&pageSize=${pageSize}`;
      } else {
        // For all donors
        url = `/api/donation/campaign/donor-list?pageNo=${pageNo}&pageSize=${pageSize}`;
      }
      
      const response = await HttpClient.get<ApiResponse<DonorListResponse>>(url);
      
      if (response.data.data) {
        return response.data.data;
      }

      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching donor list:', error);
      throw error;
    }
  }


  /**
   * Search donors by name or email
   * @param searchTerm - Search term
   * @param pageNo - Page number
   * @param pageSize - Number of items per page
   * @returns Promise with donor list response
   */
  async searchDonors(
    searchTerm: string, 
    pageNo: number = 1, 
    pageSize: number = 50
  ): Promise<DonorListResponse> {
    try {
      const response = await HttpClient.get<ApiResponse<DonorListResponse>>(
        `/api/donation/campaign/donor-list?pageNo=${pageNo}&pageSize=${pageSize}&search=${encodeURIComponent(searchTerm)}`
      );
      
      if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error searching donors:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const donorService = new DonorService();

export default donorService;