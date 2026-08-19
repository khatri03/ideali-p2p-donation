import HttpClient from "../../httpClient/HttpClient";

interface PresetTip {
  percent: number;
  isDefault: boolean;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Donation Service
 * Handles all API calls related to donations
 */
class donatePaymentService {
/**
 * Fetch preset tips configuration
 * @returns Promise with API response containing array of preset tip options
 */
async getPresetTips(): Promise<ApiResponse<PresetTip[]>> {
  try {
    const response = await HttpClient.get<PresetTip[]>(
      '/api/donation/preset-tips'
    );
    console.log('Fetched preset tips:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Error fetching preset tips:', error);
    return {
      success: false,
      data: []
    };
  }
}
}

export const donationService = new donatePaymentService();
export type { PresetTip, ApiResponse };