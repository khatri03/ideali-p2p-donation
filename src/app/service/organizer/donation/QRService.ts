import HttpClient from "../../httpClient/HttpClient";

export interface QRCodeGenerateRequest {
  value: string; 
  width?: number; 
  height?: number; 
  includeLogo?: boolean;
}

class QRService {
  /**
   * Generate QR code for a donation campaign link
   * @param donationLink - The full donation URL to encode in QR code
   * @param width - Optional width for QR code (default: API handles)
   * @param height - Optional height for QR code (default: API handles)
   * @param includeLogo - Optional logo inclusion (default: false)
   * @returns Promise with QR code image as blob URL
   */
  async generateQRCode(
    donationLink: string,
    width?: number,
    height?: number,
    includeLogo: boolean = false
  ): Promise<string> {
    try {
      console.log('Generating QR code for link:', donationLink);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (width) queryParams.append('width', width.toString());
      if (height) queryParams.append('height', height.toString());
      queryParams.append('includeLogo', includeLogo.toString());

      
      const url = `/api/qr-code/generate?${queryParams.toString()}`;
      
      const requestBody = {
        value: donationLink,
      };

      console.log('QR Code request URL:', url);
      console.log('QR Code request body:', requestBody);

      const response = await HttpClient.post(
        url,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'blob', 
        }
      );

      console.log('QR Code response:', response);

      // Create blob URL from the image response
      const blob = new Blob([response.data], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);
      
      console.log('QR Code generated successfully, blob URL:', blobUrl);
      return blobUrl;
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      throw error;
    }
  }

  /**
   * Generate donation link for a campaign
   * @param campaignId - Unique ID of the campaign
   * @returns Full donation URL
   */
  getDonationLink(campaignId: string): string {
    const domain = window.location.origin;
    return `${domain}/donate/${campaignId}`;
  }

  /**
   * Generate QR code for a campaign's donation link
   * @param campaignId - Unique ID of the campaign
   * @param width - Optional width for QR code
   * @param height - Optional height for QR code
   * @param includeLogo - Optional logo inclusion (default: false)
   * @returns Promise with QR code blob URL
   */
  async generateCampaignQRCode(
    campaignId: string,
    width?: number,
    height?: number,
    includeLogo: boolean = false
  ): Promise<string> {
    const donationLink = this.getDonationLink(campaignId);
    return this.generateQRCode(donationLink, width, height, includeLogo);
  }
}

export default new QRService();