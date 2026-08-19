import { getFileExtension } from "app/components/organizer/donation/organizerDonationComponents/helperFuntions";
import HttpClient from "../../httpClient/HttpClient";

export interface RecurringDonationData {
  uniqueId: string;
  campaignName: string;
  amount: number;
  currentStatus: string;
  frequency: string;
  paymentMethod: string;
  methodDetail: {
    last4: string | null;
    brand: string | null;
    expiry: string | null;
  };
  contact: {
    prefix: number;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: number;
    maritalStatus: number;
    ssn: string | null;
    dob: string | null;
    primaryEmail: string;
    secondaryEmail: string;
    workEmail: string;
    cellPhone: string;
    workPhone: string;
    homePhone: string;
    address: {
      streetLine1: string | null;
      streetLine2: string | null;
      zipCode: string | null;
    };
  };
  lastRecurringUtc: string | null;
  nextRecurringUtc: string;
}

export interface RecurringDonationListResponse {
  data: {
    pageNo: number;
    pageSize: number;
    pageCount: number;
    totalRecordsCount: number;
    pageData: RecurringDonationData[];
  };
}

export interface RecurringDonationListParams {
  pageNo: number;
  pageSize: number;
  status?: string;
}

class RecurringDonationService {
  /**
   * Get recurring donations list by status
   * @param status - Status filter (Processing, Waiting, Failed, Cancelled)
   * @param pageNo - Page number
   * @param pageSize - Number of items per page
   * @returns Promise with recurring donations list
   */
  async getRecurringDonationsByStatus(
    status: string,
    pageNo: number = 1,
    pageSize: number = 50
  ): Promise<RecurringDonationListResponse> {
    try {
      const params = new URLSearchParams({
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await HttpClient.get<RecurringDonationListResponse>(
        `/api/donation/recurring/list/${status}?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching recurring donations by status:', error);
      throw error;
    }
  }


  async exportRecurringDonationList(
    exportFormat: string,
    pageNo?: number,
    pageSize?: number,
    searchTerm?: string,
    archived?: boolean,
    status?: string,
    campaignId?: string
  ): Promise<void> {
    try {
      // Validate that status is provided (required for this endpoint)
      if (!status) {
        throw new Error('Status is required for exporting recurring donation list');
      }
      
      // Build the URL based on whether campaignId is provided
      let url: string;
      
      if (campaignId) {
        // Campaign-specific recurring donation list export
        url = `/api/donation/recurring/${campaignId}/list/${status}/${exportFormat}/export`;
      } else {
        // General recurring donation list export (all campaigns)
        url = `/api/donation/recurring/list/${status}/${exportFormat}/export`;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add pageNo (default: 1)
      if (pageNo !== undefined) {
        params.append('pageNo', pageNo.toString());
      }
      
      // Add pageSize (default: 50)
      if (pageSize !== undefined) {
        params.append('pageSize', pageSize.toString());
      }
      
      // Add archived parameter (default: false)
      if (archived !== undefined) {
        params.append('archived', archived.toString());
      }
      
      // Note: searchTerm parameter is kept for type compatibility
      // with ExportServiceFunction but not used by this API endpoint
      
      const fullUrl = `${url}?${params.toString()}`;
      
      console.log('Exporting recurring donation list:', { 
        exportFormat,
        status, 
        pageNo, 
        pageSize, 
        archived,
        campaignId: campaignId,
      });
      console.log('Request URL:', fullUrl);
      
      // Make the API call with blob response type
      const response = await HttpClient.get(fullUrl, {
        responseType: 'blob',
      });
      
      // Create blob from response
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Extract filename from Content-Disposition header or use default
       const fileExtension = getFileExtension(exportFormat);
      let filename = `Recurring_Donation_List_${status}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`Export successful: ${filename}`);
    } catch (error) {
      console.error('Error exporting recurring donation list:', error);
      throw error;
    }
  }

  /**
 * Get recurring donations list by campaign ID and status
 * @param campaignId - Campaign unique ID
 * @param status - Status filter (Waiting, Processing, Failed, Cancelled)
 * @param pageNo - Page number
 * @param pageSize - Number of items per page
 * @returns Promise with recurring donations list
 */
async getRecurringDonationsByCampaignAndStatus(
  campaignId: string,
  status: string,
  pageNo: number = 1,
  pageSize: number = 50
): Promise<RecurringDonationListResponse> {
  try {
    const params = new URLSearchParams({
      pageNo: pageNo.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await HttpClient.get<RecurringDonationListResponse>(
      `/api/donation/recurring/${campaignId}/list/${status}?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching recurring donations by campaign and status:', error);
    throw error;
  }
}

/**
 * Get all recurring donations for a specific campaign (no status filter)
 * @param campaignId - Campaign unique ID
 * @param pageNo - Page number
 * @param pageSize - Number of items per page
 * @returns Promise with recurring donations list
 */
async getAllRecurringDonationsByCampaign(
  campaignId: string,
  pageNo: number = 1,
  pageSize: number = 50
): Promise<RecurringDonationListResponse> {
  try {
    const params = new URLSearchParams({
      pageNo: pageNo.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await HttpClient.get<RecurringDonationListResponse>(
      `/api/donation/recurring/${campaignId}/list?${params.toString()}`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching all recurring donations by campaign:', error);
    throw error;
  }
}

  /**
   * Get all recurring donations (no status filter)
   * @param pageNo - Page number
   * @param pageSize - Number of items per page
   * @returns Promise with all recurring donations
   */
  async getAllRecurringDonations(
    pageNo: number = 1,
    pageSize: number = 50
  ): Promise<RecurringDonationListResponse> {
    try {
      const params = new URLSearchParams({
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await HttpClient.get<RecurringDonationListResponse>(
        `/api/donation/recurring/list?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching all recurring donations:', error);
      throw error;
    }
  }

  /**
   * Cancel a recurring donation
   * @param recurringId - Unique ID of the recurring donation
   * @param cancellationNotes - Optional notes for cancellation
   * @returns Promise with cancellation response
   */
  async cancelRecurringDonation(recurringId: string, cancellationNotes?: string): Promise<any> {
    try {
      const requestBody = {
        recurringId: recurringId,
        cancellationNotes: cancellationNotes || ''
      };

      const response = await HttpClient.post(
        `/api/donation/recurring/cancel`,
        requestBody
      );

      return response.data;
    } catch (error) {
      console.error('Error cancelling recurring donation:', error);
      throw error;
    }
  }
}

export default new RecurringDonationService();