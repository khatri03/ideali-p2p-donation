import HttpClient from '../httpClient/HttpClient';

/**
 * Interface for sign-up request data
 */

export interface SignUpData {
  organizerInfo: {
    organizerName: string;
    shortName: string;
    timeZoneId: number;
  };
  userInfo: {
    email: string;
    password: string;
  };
  contactDetail: {
    firstName: string;
    lastName: string;
    primaryEmail: string;
    cellPhone: string;
  };
  addressInfo: {
    streetLine1: string;
    streetLine2: string;
    zipCode: string;
    countryId: number;
    stateId: number;
    city: string;
  };
}
export interface SignUpRequestDto {
  organizer: {
    name: string;
    shortName: string;
    timezoneId: number;
  };
  user: {
    emailAddress: string;
    password: string;
  };
  contact: {
    firstName: string;
    lastName: string;
    primaryEmail: string;
    cellPhone: string;
  };
  address: {
    streetLine1: string;
    streetLine2: string;
    zipCode: string;
    countryId: number;
    stateId: number;
    city: string;
  };
}

/**
 * Interface for sign-up response data
 */
export interface SignUpResponseDto {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Service for managing authentication operations
 */
class signUpService {
  /**
   * Sign up a new organizer account
   * @param signUpData - The sign-up form data
   * @returns Promise with sign-up response
   */
  static async signUp(signUpData: SignUpRequestDto): Promise<SignUpResponseDto> {
    try {
      const response = await HttpClient.post<SignUpResponseDto>(
        '/api/organizer/public/sign-up',
        signUpData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to create account');
    } catch (error: any) {
      // Handle validation errors
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessage = Object.keys(validationErrors)
          .map(key => `${key}: ${validationErrors[key].join(', ')}`)
          .join('\n');
        throw new Error(errorMessage);
      }

      // Handle other errors
      throw new Error(
        error?.response?.data?.message || 
        error?.message || 
        'Failed to create account'
      );
    }
  }

  /**
   * Verify 2FA code during login
   * @param twoFaToken - The 2FA token from authentication response
   * @param emailCode - The 6-digit OTP code sent to user's email
   * @returns Promise with verification response containing access token
   */
  static async verify2FA(twoFaToken: string, emailCode: string): Promise<SignUpResponseDto> {
    try {
      const response = await HttpClient.post<SignUpResponseDto>(
        `/api/identity/account/2fa/${twoFaToken}/verify`,
        { emailCode },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Verification failed. Please try again.'
      );
    }
  }
}

export default signUpService;