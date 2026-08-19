import HttpClient from '../httpClient/HttpClient';

interface ForgotPasswordRequest {
  email: string;
}

interface VerifyTokenRequest {
  token: string;
}

interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiResponse<T = any> {
  data?: T;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any;
  meta: any;
  timestamp: string;
}

class ForgetPasswordService {
  /**
   * Send forgot password email with reset link
   * @param email - User's email address
   * @returns Promise with API response
   */
  async sendForgotPasswordEmail(email: string): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('Email', email);

      const response = await HttpClient.post<ApiResponse>(
        '/api/identity/account/forgot-password',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Verify the reset token from email link
   * @param token - Reset token from URL
   * @returns Promise with API response
   */
  async verifyResetToken(token: string): Promise<ApiResponse<string>> {
    try {
      const response = await HttpClient.post<ApiResponse<string>>(
        `/api/identity/account/password-verify-link?token=${token}`,
        {}
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Reset password with new password
   * @param resetToken - Token from email
   * @param newPassword - New password
   * @param confirmPassword - Confirm new password
   * @returns Promise with API response
   */
  async resetPassword(
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('ResetToken', resetToken);
      formData.append('NewPassword', newPassword);
      formData.append('ConfirmPassword', confirmPassword);

      const response = await HttpClient.post<ApiResponse>(
        '/api/identity/account/reset-password',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

const forgetPasswordService = new ForgetPasswordService();
export default forgetPasswordService;
