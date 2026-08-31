import { getFileExtension } from 'app/components/organizer/donation/organizerDonationComponents/helperFuntions';
import HttpClient from '../../httpClient/HttpClient';

export interface DonationCampaign {
  uniqueId: string;
  name: string;
  bannerList: string[];
  status: string;
  goal: {
    goal: number | null;
    goalAchieved: number;
  };
  invoiceCount: number;
  /** Fundraising pages on this campaign waiting for the charity to approve them. Zero when none are. */
  pendingFundraiserApprovalCount: number;
  startDate: string;
  endDate: string;
  cancellationDateUtc: string | null;
  cancellationNotes: string | null;
}

export interface DonationCampaignListResponse {
  data: {
    pageNo: number;
    pageSize: number;
    pageCount: number;
    totalRecordsCount: number;
    pageData: DonationCampaign[];
  };
}

export interface DonationListParams {
  pageNo: number;
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentMethodOption {
  text: string;
  value: number;
}

export interface PresetAmount {
  amount: number;
  description: string;
}

export interface PresetSettings {
  'one Time'?: PresetAmount[];
  monthly?: PresetAmount[];
  yearly?: PresetAmount[];
}

export interface CampaignDonateDetails {
  uniqueId: string;
  name: string;
  description: string;
  fundRaisingGoal: {
    amount: number;
    visibleToDonor: boolean;
    stepNo: number;
  };
  themeColor: string;
  startDate: string;
  endDate: string;
  paymentMethods: PaymentMethodOption[];
  presetSettings: PresetSettings;
  banners: string[];
  paymentAccountId: string;
  /** Whether supporters may create their own fundraising pages on this campaign. */
  isPeerToPeerEnabled: boolean;
}

export interface StripeCredentials {
  publishableKey: string;
  stripeAccount: string;
}

export interface CampaignDonateResponse {
  data: CampaignDonateDetails;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface CompletedStepsResponse {
  data: number[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface GenerateAIImageResponse {
  data: string; // Base64 encoded image data
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

class DonationService {
  /**
   * @param params
   * @returns
   */
  async getDonationCampaignList(
    params: DonationListParams,
  ): Promise<DonationCampaignListResponse> {
    try {
      const queryParams = new URLSearchParams({
        pageNo: params.pageNo.toString(),
        pageSize: params.pageSize.toString(),
      });

      if (params.search) {
        queryParams.append('searchTerm', params.search);
      }
      if (params.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      if (params.endDate) {
        queryParams.append('endDate', params.endDate);
      }

      const response = await HttpClient.get<DonationCampaignListResponse>(
        `/api/donation/campaign/list?${queryParams.toString()}`,
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching donation campaign list:', error);
      throw error;
    }
  }

  /**
   * @param campaignId - Unique ID of the campaign
   * @returns Promise with campaign details
   */
  async getDonationCampaignById(campaignId: string): Promise<DonationCampaign> {
    try {
      const response = await HttpClient.get<{ data: DonationCampaign }>(
        `/api/donation/campaign/${campaignId}`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching donation campaign:', error);
      throw error;
    }
  }

  /**
   * Step 1: Get Basic Info (name, startDate, endDate)
   */
  async getBasicInfo(campaignId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignId}/basic-info`,
      );
      console.log('Basic Info Response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching basic info:', error);
      return null;
    }
  }

  /**
   * Step 2: Get Goal
   */
  async getGoal(campaignId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignId}/get-goal`,
      );
      console.log('Goal Response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching goal:', error);
      return null;
    }
  }

  /**
   * Step 3: Get Description
   */
  async getDescription(campaignId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignId}/get-description`,
      );
      console.log('Description Response:', response.data);
      console.log('Description Response.data:', response.data.data);
      console.log(
        'Full Response Object:',
        JSON.stringify(response.data, null, 2),
      );

      // Try multiple possible response structures
      const description =
        response.data.data || response.data.description || response.data || '';

      console.log('Extracted Description:', description);
      return description;
    } catch (error: any) {
      console.error('Error fetching description:', error);
      return '';
    }
  }

  /**
   * Step 4: Get Payment Account
   */
  async getPaymentAccount(campaignId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignId}/get-payment-account`,
      );
      console.log('Payment Account Response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching payment account:', error);
      return null;
    }
  }

  /**
   * Step 5: Get Presets (Preset Donation Amounts)
   */
  async getPresets(campaignId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignId}/get-presets`,
      );
      console.log('Presets Response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching presets:', error);
      return null;
    }
  }

  /**
   * Step 6: Get Campaign Theme (Color)
   */
  async getCampaignTheme(campaignId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignId}/get-campaign-theme`,
      );
      console.log('Campaign Theme Response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching campaign theme:', error);
      return null;
    }
  }

  /**
   * Step 8: Get Email Template (Thank You Email)
   */
  async getEmailTemplate(campaignId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignId}/get-email-template`,
      );
      console.log('Email Template Response:', response.data);
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error fetching email template:', error);
      return null;
    }
  }

  /**
   * @param campaignId - Unique ID of the campaign
   * @returns Promise with full campaign details for editing - fetches data from all step endpoints
   */
  async getCampaignDetailForEdit(campaignId: string): Promise<any> {
    try {
      console.log(`Fetching complete campaign data for ID: ${campaignId}`);

      const [
        basicInfo,
        goal,
        description,
        paymentAccount,
        presets,
        theme,
        banners,
        emailTemplate,
      ] = await Promise.all([
        this.getBasicInfo(campaignId),
        this.getGoal(campaignId),
        this.getDescription(campaignId),
        this.getPaymentAccount(campaignId),
        this.getPresets(campaignId),
        this.getCampaignTheme(campaignId),
        this.getBanners(campaignId).catch((): string[] => []),
        this.getEmailTemplate(campaignId),
      ]);

      console.log('Fetched Step Data:', {
        basicInfo,
        goal,
        description,
        paymentAccount,
        presets,
        theme,
        banners,
        emailTemplate,
      });

      const campaignData = {
        title:
          basicInfo?.name || basicInfo?.title || basicInfo?.campaignName || '',
        startDate: basicInfo?.startDate || basicInfo?.start || null,
        endDate: basicInfo?.endDate || basicInfo?.end || null,

        goalAmount:
          goal?.amount !== undefined
            ? goal.amount
            : goal?.fundRaisingGoal || goal?.goalAmount || goal?.goal || null,
        visibleToDonor:
          goal?.visibleToDonor !== undefined ? goal.visibleToDonor : true,

        description:
          typeof description === 'string'
            ? description
            : description?.description ||
              description?.campaignDescription ||
              description?.details ||
              '',

        paymentAccountId:
          paymentAccount?.paymentAccountId || paymentAccount?.accountId || 0,
        paymentMethods:
          paymentAccount?.paymentMethods || paymentAccount?.methods || [],

        presetAmounts: presets
          ? {
              oneTime: presets.oneTime || { enabled: false, presetDetails: [] },
              monthly: presets.monthly || { enabled: false, presetDetails: [] },
              yearly: presets.yearly || { enabled: false, presetDetails: [] },
            }
          : {
              oneTime: { enabled: false, presetDetails: [] },
              monthly: { enabled: false, presetDetails: [] },
              yearly: { enabled: false, presetDetails: [] },
            },

        themeColor:
          typeof theme === 'string'
            ? theme
            : theme?.themeColor || theme?.color || theme?.theme || '#044bd9',

        images: banners || [],

        emailSubject:
          emailTemplate?.emailSubject || emailTemplate?.subject || '',
        emailBody: emailTemplate?.emailBody || emailTemplate?.body || '',

        enableMonthlyRecurring: paymentAccount?.enableMonthlyRecurring || false,
        enableYearlyRecurring: paymentAccount?.enableYearlyRecurring || false,
        customFormId: basicInfo?.customFormId || null,
      };

      console.log('Combined campaign data:', campaignData);
      return campaignData;
    } catch (error: any) {
      console.error('Error fetching campaign detail:', {
        campaignId,
        error: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      throw error;
    }
  }

  async getCampaignReviewData(campaignUniqueId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignUniqueId}/review-data`,
      );
      console.log('fetch campaign review data', campaignUniqueId);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign review data:', error);
      throw error;
    }
  }

  async publishCampaign(campaignUniqueId: string): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignUniqueId}/publish`,
        {},
        { headers: { 'Content-Type': 'application/json' } },
      );
      console.log('publish campaign', campaignUniqueId);
      return response.data;
    } catch (error) {
      console.error('Error publishing campaign:', error);
      throw error;
    }
  }

  async deleteCampaign(campaignUniqueId: string): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignUniqueId}/delete`,
      );
      console.log('delete campaign', campaignUniqueId);
      return response.data;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  async archiveCampaign(campaignUniqueId: string): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignUniqueId}/archived`,
      );
      console.log('archive campaign ', campaignUniqueId);
      return response.data;
    } catch (error) {
      console.error('Error archiving campaign:', error);
      throw error;
    }
  }

  /**
   * @param bannerId - Banner ID from the bannerList
   * @returns Full URL to the banner image
   */
  getBannerImageUrl(bannerId: string): string {
    return `https://api.testing.Ideali.com/api/images/${bannerId}`;
  }

  /**
   * Export donation invoice list
   * @param exportFormat - Format for export (Excel, PDF, CSV, etc.)
   * @param pageNo - Page number (optional, defaults to 1 for full export)
   * @param pageSize - Page size (optional, defaults to large number for full export)
   * @param searchTerm - Optional search term
   * @returns Promise that triggers file download
   */

  async exportDonationInvoiceList(
    exportFormat: string,
    pageNo?: number,
    pageSize?: number,
    searchTerm?: string,
    archived?: boolean,
    status?: string,
    uniqueId?: string,
  ): Promise<void> {
    try {
      // Build the URL based on whether uniqueId is provided
      let url: string;

      if (uniqueId) {
        // Campaign-specific donation invoice list export
        url = `/api/invoice/donation/${uniqueId}/list/paid/${exportFormat}/export`;
      } else {
        // General donation invoice list export (all campaigns)
        url = `/api/invoice/donation/list/paid/${exportFormat}/export`;
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

      // Add searchTerm if provided
      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }

      // Note: archived and status parameters kept for type compatibility
      // with ExportServiceFunction but not used by this API endpoint

      const fullUrl = `${url}?${params.toString()}`;

      console.log('Exporting donation invoice list:', {
        exportFormat,
        pageNo,
        pageSize,
        searchTerm,
        uniqueId: uniqueId,
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
      let filename = `Donation_Invoice_List_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
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
      console.error('Error exporting donation invoice list:', error);
      throw error;
    }
  }

  async exportDonationCampaignList(
    exportFormat: string,
    pageNo?: number,
    pageSize?: number,
    searchTerm?: string,
    archived?: boolean,
  ): Promise<void> {
    try {
      // Build the URL with the export format in the path
      const url = `/api/donation/campaign/list/${exportFormat}/export`;

      console.log(url);
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

      // Add searchTerm if provided
      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }

      // Add archived parameter (default: true based on image)
      if (archived !== undefined) {
        params.append('archived', archived.toString());
      }

      const fullUrl = `${url}?${params.toString()}`;

      console.log('Exporting campaign list:', {
        exportFormat,
        pageNo,
        pageSize,
        searchTerm,
        archived,
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
      let filename = `Donation_Campaign_List_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
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
      console.error('Error exporting donation campaign list:', error);
      throw error;
    }
  }

  async exportDonorList(
    exportFormat: string,
    pageNo?: number,
    pageSize?: number,
    searchTerm?: string,
    archived?: boolean,
    status?: string,
    campaignId?: string,
  ): Promise<void> {
    try {
      // Build the URL based on whether campaignId is provided
      let url: string;

      if (campaignId) {
        // Campaign-specific donor list export
        url = `/api/donation/campaign/${campaignId}/donor-list/${exportFormat}/export`;
      } else {
        // General donor list export (all campaigns)
        url = `/api/donation/campaign/donor-list/${exportFormat}/export`;
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

      // Note: searchTerm parameter is not used by this API endpoint
      // but kept for type compatibility with ExportServiceFunction

      // Add archived parameter (default: false)
      if (archived !== undefined) {
        params.append('archived', archived.toString());
      }

      const fullUrl = `${url}?${params.toString()}`;

      console.log('Exporting donor list:', {
        exportFormat,
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
      let filename = `Donation_Donor_List_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
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
      console.error('Error exporting donor list:', error);
      throw error;
    }
  }

  /**
   * @param campaignUniqueId - Campaign unique ID
   * @returns Promise with array of banner IDs
   */
  async getBanners(campaignUniqueId: string): Promise<string[]> {
    try {
      const response = await HttpClient.post<{ data: string[] }>(
        `/api/donation/campaign/${campaignUniqueId}/get-banners`,
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching banners:', error);
      throw error;
    }
  }

  /**
   * Remove a banner from a campaign
   * @param campaignUniqueId - Campaign unique ID
   * @param bannerId - Banner ID to remove (not used in request body, only for logging)
   * @returns Promise with response
   */
  async removeBanner(campaignUniqueId: string, bannerId: string): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignUniqueId}/remove-banner`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error('Error removing banner:', error);
      throw error;
    }
  }

  /**
   * @param bannerId
   * @returns
   */
  async getBannerImageBlob(bannerId: string): Promise<string> {
    try {
      // Extract just the banner ID if it's a full path
      const bannerIdOnly =
        bannerId.includes('/') || bannerId.includes('\\')
          ? bannerId.split(/[/\\]/).pop()?.replace('.png', '') || bannerId
          : bannerId.replace('.png', '');
      const bannerUrl = `/api/images/${bannerIdOnly}.png`;
      console.log(`Fetching banner image: ${bannerUrl}`);

      const response = await HttpClient.get(bannerUrl, {
        responseType: 'blob',
      });

      console.log('Banner response:', {
        status: response.status,
        contentType: response.headers['content-type'],
        dataType: typeof response.data,
        dataSize: response.data?.size,
      });

      // Create blob URL from the response
      const blob = new Blob([response.data], {
        type: (response.headers['content-type'] as string) || 'image/png',
      });
      const blobUrl = URL.createObjectURL(blob);
      console.log(`Created blob URL for ${bannerIdOnly}: ${blobUrl}`);
      return blobUrl;
    } catch (error: any) {
      console.error('Error fetching banner image:', {
        bannerId,
        error: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get public banner image URL (no authentication required)
   * @param bannerId - Banner ID (UUID)
   * @returns Full URL to the public banner image
   */
  getPublicBannerUrl(bannerId: string): string {
    // Extract just the banner ID if it's a full path
    const bannerIdOnly =
      bannerId.includes('/') || bannerId.includes('\\')
        ? bannerId.split(/[/\\]/).pop()?.replace('.png', '') || bannerId
        : bannerId.replace('.png', '');

    return `/api/images/${bannerIdOnly}.png`;
  }

  /**
   * @param campaignUniqueId - Unique ID of the campaign
   * @returns Promise with campaign donate details
   */
  async getCampaignDonateDetails(
    campaignUniqueId: string,
  ): Promise<CampaignDonateDetails> {
    try {
      const response = await HttpClient.get<CampaignDonateResponse>(
        `/api/donation/${campaignUniqueId}/donate`,
      );
      const data = response.data.data;
      console.log('Campaign donate details:', data);

      // Handle potential variations in fundRaisingGoal structure
      let goalObj = { amount: 0, visibleToDonor: true, stepNo: 0 };
      if (
        typeof data.fundRaisingGoal === 'object' &&
        data.fundRaisingGoal !== null
      ) {
        goalObj = {
          amount: (data.fundRaisingGoal as any).amount || 0,
          visibleToDonor:
            (data.fundRaisingGoal as any).visibleToDonor !== undefined
              ? (data.fundRaisingGoal as any).visibleToDonor
              : true,
          stepNo: (data.fundRaisingGoal as any).stepNo || 0,
        };
      } else if (typeof data.fundRaisingGoal === 'number') {
        goalObj = {
          amount: data.fundRaisingGoal,
          visibleToDonor: true,
          stepNo: 0,
        };
      }

      return {
        ...data,
        fundRaisingGoal: goalObj,
        // Coerced rather than trusted: an older API build omits the field entirely, and an absent
        // flag must read as "off" rather than render an entry point that leads nowhere.
        isPeerToPeerEnabled: data.isPeerToPeerEnabled === true,
      };
    } catch (error) {
      console.error('Error fetching campaign donate details:', error);
      throw error;
    }
  }

  /**
   * @param campaignUniqueId - Unique ID of the campaign
   * @returns Promise with array of completed step numbers
   */
  async getCompletedSteps(campaignUniqueId: string): Promise<number[]> {
    try {
      const response = await HttpClient.get<CompletedStepsResponse>(
        `/api/donation/campaign/${campaignUniqueId}/get-completed-steps`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching completed steps:', error);
      throw error;
    }
  }

  /**
   * Submit donation to a campaign
   * @param campaignId - Unique ID of the campaign
   * @param donationData - Donation data to submit
   * @param turnstileToken - `Cloudflare `Turnstile token for bot protection
   * @returns Promise with donation submission response
   */
  async submitDonation(
    campaignId: string,
    donationData: DonationSubmitRequest,
    turnstileToken: string,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/${campaignId}/donate`,
        donationData,
        {
          headers: {
            'Turnstile-Token': turnstileToken,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting donation:', error);
      throw error;
    }
  }

  /**
   * Create a new campaign
   * @param basicInfo - Object containing name, startDate, and endDate
   * @returns Promise with campaign unique ID
   */
  async createCampaign(basicInfo: {
    name: string;
    startDate: Date | string;
    endDate: Date | string;
  }): Promise<any> {
    try {
      console.log('🚀 Creating campaign with data:', basicInfo);
      const response = await HttpClient.post(
        `/api/donation/campaign/create`,
        basicInfo,
      );
      console.log('✅ Campaign created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating campaign:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      console.error('Error message:', error?.message);
      throw error;
    }
  }

  /**
   * Update basic info (name, startDate, endDate) for an existing campaign
   * @param campaignUniqueId - Unique ID of the campaign
   * @param basicInfo - Object containing name, startDate, and endDate
   * @returns Promise with update response
   */
  async updateBasicInfo(
    campaignUniqueId: string,
    basicInfo: {
      name: string;
      startDate: Date | string;
      endDate: Date | string;
    },
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignUniqueId}/set-basic-info`,
        basicInfo,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating basic info:', error);
      throw error;
    }
  }

  /**
   * Get preset amounts for a campaign
   * @param campaignUniqueId - Unique ID of the campaign
   * @returns Promise with preset amounts data
   */
  async getCampaignPresets(campaignUniqueId: string): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/donation/campaign/${campaignUniqueId}/get-presets`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign presets:', error);
      throw error;
    }
  }
  async getDashboardSummary(): Promise<any> {
    console.log(
      '%c[Dashboard API] Fetching dashboard summary...',
      'color: #00bfff',
    );

    const url = '/api/donation/campaign/dashboard/summary';
    console.log('%c[Dashboard API] URL:', 'color: #00bfff', url);

    try {
      const response = await HttpClient.get(url);

      console.log(
        '%c[Dashboard API] Raw Response:',
        'color: #00e676',
        response,
      );

      if (!response) {
        console.error('[Dashboard API] Response is NULL or undefined!');
        return null;
      }

      console.log(
        '%c[Dashboard API] Status:',
        'color: #00e676',
        response.status,
      );

      const data = response.data?.data ?? response.data;

      console.log('%c[Dashboard API] Parsed Data:', 'color: #00e676', data);

      if (!data) {
        console.warn('[Dashboard API] Data inside response is NULL!');
      }

      return data;
    } catch (error: any) {
      console.error(
        '%c[Dashboard API] ERROR:',
        'color: red; font-weight: bold;',
        error,
      );

      if (error.response) {
        console.error('[Dashboard API] Error Response:', error.response);
        console.error('[Dashboard API] Status Code:', error.response.status);
        console.error('[Dashboard API] Response Data:', error.response.data);
      } else if (error.request) {
        console.error(
          '[Dashboard API] Request Sent But No Response!',
          error.request,
        );
      } else {
        console.error('[Dashboard API] Unexpected Error:', error.message);
      }

      return null;
    }
  }

  /**
   * Generate AI image using OpenAI
   * @param prompt - Text prompt for image generation
   * @param imageSize - Aspect ratio for the image: '1:1' or '16:9' (defaults to '16:9')
   * @returns Promise with base64 encoded image data
   */
  async generateAIImage(prompt: string, imageSize: '1:1' | '16:9' = '16:9'): Promise<GenerateAIImageResponse> {
    try {
      console.log('🎨 Generating AI image with prompt:', prompt, 'size:', imageSize);

      const response = await HttpClient.get<GenerateAIImageResponse>(
        `/api/OpenAI?Prompt=${encodeURIComponent(prompt)}&ImageSize=${encodeURIComponent(imageSize)}`
      );

      console.log('✅ AI image generated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error generating AI image:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      console.error('Error message:', error?.message);
      throw error;
    }
  }

  // ============================================
  // CAMPAIGN CREATION STEP METHODS
  // ============================================

  /**
   * Step 2: Set fundraising goal for a campaign
   * @param campaignId - Unique ID of the campaign
   * @param goalData - Goal data containing amount and visibleToDonor
   * @param stepNo - Step number for tracking
   */
  async setGoal(
    campaignId: string,
    goalData: { amount: number; visibleToDonor: boolean },
    stepNo: number = 2,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignId}/set-goal?stepNo=${stepNo}`,
        goalData,
      );
      return response.data;
    } catch (error) {
      console.error('Error setting goal:', error);
      throw error;
    }
  }

  /**
   * Step 3: Set description for a campaign
   * @param campaignId - Unique ID of the campaign
   * @param descriptionData - Description data
   * @param stepNo - Step number for tracking
   */
  async setDescription(
    campaignId: string,
    descriptionData: { description: string },
    stepNo: number = 3,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignId}/set-description?stepNo=${stepNo}`,
        descriptionData,
      );
      return response.data;
    } catch (error) {
      console.error('Error setting description:', error);
      throw error;
    }
  }

  /**
   * Step 4: Get payment account items/list
   */
  async getPaymentAccountItems(): Promise<any> {
    try {
      const response = await HttpClient.get(
        '/api/organizer/payment-account/items',
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payment account items:', error);
      throw error;
    }
  }

  /**
   * Step 4: Get payment methods for a specific account
   * @param accountId - Payment account ID
   */
  async getPaymentMethodsForAccount(accountId: number): Promise<any> {
    try {
      const response = await HttpClient.get(
        `/api/organizer/payment-account/${accountId}/payment-methods`,
      );
      console.log(
        'Payment methods response for account ID',
        accountId,
        response.data,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Step 4: Set payment account for a campaign
   * @param campaignId - Unique ID of the campaign
   * @param paymentData - Payment account data
   * @param stepNo - Step number for tracking
   */
  async setPaymentAccount(
    campaignId: string,
    paymentData: { paymentAccountId: number; paymentMethods: string[] },
    stepNo: number = 4,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignId}/set-payment-account?stepNo=${stepNo}`,
        paymentData,
      );
      return response.data;
    } catch (error) {
      console.error('Error setting payment account:', error);
      throw error;
    }
  }

  /**
   * Step 5: Set preset donation amounts
   * @param campaignId - Unique ID of the campaign
   * @param presetsData - Preset amounts configuration
   * @param stepNo - Step number for tracking
   */
  async setPresets(
    campaignId: string,
    presetsData: {
      OneTime: {
        enabled: boolean;
        presetDetails: Array<{ amount: number; description: string }>;
      };
      Monthly: {
        enabled: boolean;
        presetDetails: Array<{ amount: number; description: string }>;
      };
      Yearly: {
        enabled: boolean;
        presetDetails: Array<{ amount: number; description: string }>;
      };
    },
    stepNo: number = 5,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignId}/set-presets?stepNo=${stepNo}`,
        presetsData,
      );
      return response.data;
    } catch (error) {
      console.error('Error setting presets:', error);
      throw error;
    }
  }

  /**
   * Step 6: Set campaign theme color
   * @param campaignId - Unique ID of the campaign
   * @param themeColor - Hex color code
   * @param stepNo - Step number for tracking
   */
  async setCampaignThemeColor(
    campaignId: string,
    themeColor: string,
    stepNo: number = 6,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignId}/set-campaign-theme?stepNo=${stepNo}`,
        { campaignTheme: themeColor },
      );
      return response.data;
    } catch (error) {
      console.error('Error setting campaign theme:', error);
      throw error;
    }
  }

  /**
   * Step 7: Upload campaign banner
   * @param campaignId - Unique ID of the campaign
   * @param formData - FormData containing the banner file
   * @param stepNo - Step number for tracking
   */
  async setBanner(
    campaignId: string,
    formData: FormData,
    stepNo: number = 7,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignId}/set-banner?stepNo=${stepNo}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw error;
    }
  }

  /**
   * Step 8: Set email template for thank you emails
   * @param campaignId - Unique ID of the campaign
   * @param templateData - Email template data
   * @param stepNo - Step number for tracking
   */
  async setEmailTemplate(
    campaignId: string,
    templateData: {
      emailSubject: string;
      emailBody: string;
      notifyOrganizerOnDonation?: boolean;
    },
    stepNo: number = 8,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignId}/set-email-template?stepNo=${stepNo}`,
        templateData,
      );
      return response.data;
    } catch (error) {
      console.error('Error setting email template:', error);
      throw error;
    }
  }

  async duplicateCampaign(campaignUniqueId: string): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/donation/campaign/${campaignUniqueId}/duplicate`,
      );
      return response.data;
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      throw error;
    }
  }

  async setIntegration(
    campaignUniqueId: string,
    integrationId: string,
    listId: string,
  ): Promise<any> {
    try {
      const response = await HttpClient.post(
        `/api/organizer/contact-sync/integration/create-sync-config`,
        {
          moduleType: 'Donation',
          moduleEntityId: campaignUniqueId,
          orgProviderId: integrationId,
          providerListId: listId,
          syncType: 'Automatic',
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error setting integration:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe payment intent for Google/Apple Pay
   */
  async createStripePaymentIntent(
    campaignId: string,
    payload: {
      totalAmount: number;
      paymentMethodId: string;
      payerInfo: {
        firstName: string;
        middleName?: string;
        lastName: string;
        primaryEmail: string;
        cellPhone: string;
      };
      tipDetail: {
        tipAmount: number;
        description: string;
      };
    },
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const response = await HttpClient.post<{
        data: { clientSecret: string; paymentIntentId: string };
      }>(`/api/donation/${campaignId}/stripe/create-intent`, payload);
      return response.data.data;
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      throw error;
    }
  }

  /**
   * Fetch Stripe credentials for PCI-compliant payment processing
   * @param paymentAccountUniqueId - Unique ID of the payment account
   * @returns Promise with Stripe publishableKey and stripeAccount (connected account ID)
   */
  async fetchStripeCredentials(
    paymentAccountUniqueId: string,
  ): Promise<StripeCredentials> {
    try {
      const response = await HttpClient.get<{ data: StripeCredentials }>(
        `/api/organizer/payment-account/pci/${paymentAccountUniqueId}/credentials`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Stripe credentials:', error);
      throw error;
    }
  }
}

export interface DonationSubmitRequest {
  donationAmount: number;
  frequency: string; // "OneTime", "Monthly", "Yearly"
  paymentMethod: string; // Numeric payment method value as string ("1", "2", "3", etc.)
  Notes?: string;
  paymentMethodDetail: {
    paymentMethodId: string;
    paymentIntentId?: string;
    cardHolderName?: string;
  };
  contact: {
    firstName: string;
    middleName?: string;
    lastName: string;
    primaryEmail: string;
    cellPhone?: string;
  };
}

export default new DonationService();
