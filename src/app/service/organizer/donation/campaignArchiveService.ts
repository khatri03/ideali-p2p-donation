import HttpClient from "../../httpClient/HttpClient";
import { DonationCampaignListResponse } from './donationService';

interface ApiResponse<T> {
  data: T;
}

function getFileExtension(exportFormat: string): string {
  return exportFormat.toLowerCase() === 'excel' ? 'xlsx' : 'csv';
}

class CampaignArchiveService {
  async getArchivedCampaigns(pageNo: number, pageSize: number): Promise<DonationCampaignListResponse['data']> {
    try {
      const url = `/api/donation/campaign/list/archived?pageNo=${pageNo}&pageSize=${pageSize}`;
      const response = await HttpClient.get<ApiResponse<DonationCampaignListResponse['data']>>(url);

      if (response.data && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response format for archived campaigns');
    } catch (error) {
      console.error('Error fetching archived campaigns:', error);
      throw error;
    }
  }

  // NEW: dedicated archived export using correct API endpoint
  async exportArchivedCampaigns(
    exportFormat: string,  // 'Excel' or 'Csv'
    pageNo?: number,
    pageSize?: number,
    searchTerm?: string,
  ): Promise<void> {
    try {
      
      // Correct URL: /api/donation/campaign/list/archived/{exportFormat}/export
      const url = `/api/donation/campaign/list/archived/${exportFormat}/export`;

      const params = new URLSearchParams();

      if (pageNo !== undefined) params.append('pageNo', pageNo.toString());
      if (pageSize !== undefined) params.append('pageSize', pageSize.toString());
      if (searchTerm) params.append('searchTerm', searchTerm);

      const fullUrl = `${url}?${params.toString()}`;

      const response = await HttpClient.get(fullUrl, { responseType: 'blob' });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const fileExtension = getFileExtension(exportFormat);
      let filename = `Archived_Campaign_List_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Error exporting archived campaigns:', error);
      throw error;
    }
  }
}

export default new CampaignArchiveService();