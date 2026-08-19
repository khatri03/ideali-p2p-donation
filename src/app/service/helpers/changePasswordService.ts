import HttpClient from '../httpClient/HttpClient';

/**
 * Interface for change password request
 */
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface for change password response
 */
interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Service for managing password operations
 */
class PasswordService {
  /**
   * Change user password
   * @param passwordData - Object containing current password, new password, and confirm password
   * @returns Promise with password change response
   */
  static async changePassword(
    passwordData: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    try {
      // Create FormData object to match multipart/form-data format
      const formData = new FormData();
      formData.append('CurrentPassword', passwordData.currentPassword);
      formData.append('NewPassword', passwordData.newPassword);
      formData.append('ConfirmPassword', passwordData.confirmPassword);

      const response = await HttpClient.post<ChangePasswordResponse>(
        '/api/identity/account/change-password',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        return response.data;
      }

      throw new Error(response.statusText || 'Failed to change password');
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to change password'
      );
    }
  }
}

export default PasswordService;