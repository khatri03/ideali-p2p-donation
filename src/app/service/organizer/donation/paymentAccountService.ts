// paymentAccountService.ts
import HttpClient from 'app/service/httpClient/HttpClient';

/**
 * Interface definitions for Payment Account Service
 */
export interface PaymentMerchant {
  id: number;
  name: string;
}

export interface PaymentCurrency {
  text: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

export interface CreatePaymentAccountRequest {
  accountName: string;
  paymentMerchant: {
    id: number;
  };
  paymentCurrency: {
    id: number;
  };
  accountCredentials: {
    stripeAccount: string;
    secretKey?: string;
    publishableKey?: string;
  };
  isDefault: boolean;
}

export interface CreatePaymentAccountResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface StripeOAuthSettings {
  clientId: string | null;
  oAuthUrl: string | null;
}

export interface PaymentAccountListItem {
  uniqueId: string;
  name: string;
  paymentMerchant: string;
  paymentCurrency: string;
}

export interface UpdatePaymentAccountRequest {
  accountName: string;
  paymentCurrency: {
    id: number;
  };
  isDefault?: boolean;
}

export interface PaymentAccountDetail {
  id: number;
  uniqueId: string;
  accountName: string;
  organizerId: number;
  paymentMerchant: {
    id: number;
    name: string;
  };
  paymentCurrency: {
    id: number;
    currency: string;
  };
  paymentCurrencyId: number;
  accountCredentials: {
    [key: string]: string;
  };
  isDefault: boolean;
  isDeleted: boolean;
  createdBy: string;
  createdOnUtc: string;
  updatedBy: string;
  updatedOnUtc: string;
}

export interface PaymentAccountListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: PaymentAccountListItem[];
}

export interface StripeOAuthSettingsResponse {
  data: StripeOAuthSettings;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface StripeTokenExchangeData {
  access_token: string;
  stripe_user_id: string;
  stripe_publishable_key: string;
}

export interface StripeTokenExchangeResponse {
  data: StripeTokenExchangeData;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

/**
 * Payment Account Service
 * Handles all API calls related to payment accounts
 */
class PaymentAccountService {
  /**
   * Fetch list of available payment merchants
   * @returns Promise with array of payment merchants
   */
  async getPaymentMerchants(): Promise<ApiResponse<PaymentMerchant[]>> {
    try {
      const response = await HttpClient.get<ApiResponse<PaymentMerchant[]>>(
        '/api/admin/list-items/payment-merchants',
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment merchants:', error);
      throw error;
    }
  }

  /**
   * Fetch list of available payment currencies
   * @returns Promise with array of payment currencies
   */
  async getPaymentCurrencies(): Promise<ApiResponse<PaymentCurrency[]>> {
    try {
      const response = await HttpClient.get<ApiResponse<PaymentCurrency[]>>(
        '/api/admin/list-items/payment-currencies',
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment currencies:', error);
      throw error;
    }
  }

  /**
   * Fetch both merchants and currencies in parallel
   * @returns Promise with both merchants and currencies data
   */
  async getMerchantsAndCurrencies(): Promise<{
    merchants: ApiResponse<PaymentMerchant[]>;
    currencies: ApiResponse<PaymentCurrency[]>;
  }> {
    try {
      const [merchants, currencies] = await Promise.all([
        this.getPaymentMerchants(),
        this.getPaymentCurrencies(),
      ]);

      return { merchants, currencies };
    } catch (error: any) {
      console.error('Error fetching merchants and currencies:', error);
      throw error;
    }
  }

  /**
   * Create a new payment account
   * @param data - Payment account creation data
   * @returns Promise with creation response
   */
  async createPaymentAccount(
    data: CreatePaymentAccountRequest,
  ): Promise<CreatePaymentAccountResponse> {
    try {
      const response = await HttpClient.post<ApiResponse<any>>(
        '/api/organizer/payment-account/create',
        data,
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating payment account:', error);
      throw error;
    }
  }

  /**
   * Fetch Stripe OAuth settings
   * @returns Promise with Stripe OAuth settings
   */
  async getStripeOAuthSettings(): Promise<StripeOAuthSettingsResponse> {
    try {
      const response = await HttpClient.get<StripeOAuthSettingsResponse>(
        '/api/organizer/payment-account/stripe/oauth-settings',
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Stripe OAuth settings:', error);
      throw error;
    }
  }

  /**
   * Exchange Stripe authorization code for access token
   * @param code - Authorization code from Stripe OAuth redirect
   * @returns Promise with Stripe credentials
   */
  async exchangeStripeToken(
    code: string,
  ): Promise<StripeTokenExchangeResponse> {
    try {
      const response = await HttpClient.post<StripeTokenExchangeResponse>(
        `/api/organizer/payment-account/stripe/exchange-token?token=${code}`,
      );
      return response.data;
    } catch (error: any) {
      console.error('Error exchanging Stripe token:', error);
      throw error;
    }
  }

  /**
   * Helper method to prepare request body for creating payment account
   * @param accountName - Name of the account
   * @param merchantId - ID of selected merchant
   * @param currencyId - ID of selected currency
   * @param stripeAccount - Stripe account identifier
   * @param isDefault - Whether this is the default account
   * @returns Formatted request object
   */
  prepareCreatePaymentAccountRequest(
    accountName: string,
    merchantId: number,
    currencyId: number,
    stripeAccount: string,
    isDefault: boolean = false,
  ): CreatePaymentAccountRequest {
    return {
      accountName,
      paymentMerchant: {
        id: merchantId,
      },
      paymentCurrency: {
        id: currencyId,
      },
      accountCredentials: {
        stripeAccount,
      },
      isDefault,
    };
  }

  /**
   * Helper method to prepare request body for creating payment account with Stripe OAuth credentials
   * @param accountName - Name of the account
   * @param merchantId - ID of selected merchant
   * @param currencyId - ID of selected currency
   * @param stripeCredentials - Stripe OAuth credentials (access_token, stripe_user_id, stripe_publishable_key)
   * @param isDefault - Whether this is the default account
   * @returns Formatted request object with Stripe credentials
   */
  prepareCreatePaymentAccountWithStripeOAuth(
    accountName: string,
    merchantId: number,
    currencyId: number,
    stripeCredentials: StripeTokenExchangeData,
    isDefault: boolean = false,
  ): CreatePaymentAccountRequest {
    return {
      accountName,
      paymentMerchant: {
        id: merchantId,
      },
      paymentCurrency: {
        id: currencyId,
      },
      accountCredentials: {
        stripeAccount: stripeCredentials.stripe_user_id,
        secretKey: stripeCredentials.access_token,
        publishableKey: stripeCredentials.stripe_publishable_key,
      },
      isDefault,
    };
  }

  /**
   * Fetch list of payment accounts with pagination
   * @param pageNo - Page number (starting from 1)
   * @param pageSize - Number of items per page
   * @returns Promise with payment account list response
   */
  async getPaymentAccountList(
    pageNo: number = 1,
    pageSize: number = 50,
  ): Promise<PaymentAccountListResponse> {
    try {
      const response = await HttpClient.get<
        ApiResponse<PaymentAccountListResponse>
      >(
        `/api/organizer/payment-account/list?pageNo=${pageNo}&pageSize=${pageSize}`,
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to fetch payment accounts');
    } catch (error) {
      console.error('Error fetching payment account :', error);
      throw error;
    }
  }

  /**
   * Get payment account details by ID
   * @param paymentAccountId - Unique ID of the payment account
   * @returns Promise with payment account details
   */
  async getPaymentAccountById(
    paymentAccountId: string,
  ): Promise<PaymentAccountDetail> {
    try {
      const response = await HttpClient.get<ApiResponse<PaymentAccountDetail>>(
        `/api/organizer/payment-account/${paymentAccountId}/detail`,
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to fetch payment account details');
    } catch (error) {
      console.error('Error fetching payment account details:', error);
      throw error;
    }
  }

  /**
   * Update payment account (name and currency)
   * @param paymentAccountId - Unique ID of the payment account to update
   * @param data - Update payment account data
   * @returns Promise with update response
   */
  async updatePaymentAccount(
    paymentAccountId: string,
    data: UpdatePaymentAccountRequest,
  ): Promise<ApiResponse<any>> {
    try {
      const response = await HttpClient.post<ApiResponse<any>>(
        `/api/organizer/payment-account/${paymentAccountId}/update`,
        data,
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating payment account:', error);
      throw error;
    }
  }

  /**
   * Helper method to prepare request body for updating payment account
   * @param accountName - Updated account name
   * @param currencyId - Updated currency ID
   * @param isDefault - Whether this is the default account (optional)
   * @returns Formatted update request object
   */
  prepareUpdatePaymentAccountRequest(
    accountName: string,
    currencyId: number,
    isDefault?: boolean,
  ): UpdatePaymentAccountRequest {
    return {
      accountName,
      paymentCurrency: {
        id: currencyId,
      },
      isDefault,
    };
  }

  async createAchPaymentIntent(
    paymentAccountUniqueId: string,
    payload: {
      amount: number;
      adminFee: number;
      user: { name: string; email: string };
      bankAccount: {
        routingNumber: string;
        accountNumber: string;
        accountHolderType: string;
        accountType: string;
      };
      description?: string;
      metaData: { ModuleEntityUniqueId: string; moduleId: number };
    },
  ): Promise<{
    clientSecret: string;
    paymentMethodId: string;
    paymentIntentId: string;
    status: string;
    nextActionType: string;
  }> {
    try {
      const response = await HttpClient.post<{
        data: {
          clientSecret: string;
          paymentMethodId: string;
          paymentIntentId: string;
          status: string;
          nextActionType: string;
        };
      }>(
        `/api/public/stripe/${paymentAccountUniqueId}/intent/create/ach`,
        payload,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating ACH payment intent:', error);
      throw error;
    }
  }
  async createPadPaymentIntent(
    paymentAccountUniqueId: string,
    payload: {
      amount: number;
      adminFee: number;
      user: { name: string; email: string };
      bankAccount: {
        accountNumber: string;
        institutionNumber: string;
        transitNumber: string;
      };
      description?: string; // pass campaign name here
      metaData: { ModuleEntityUniqueId: string; moduleId: number };
    },
  ): Promise<{
    clientSecret: string;
    paymentMethodId: string;
    paymentIntentId: string;
    status: string;
    nextActionType: string;
  }> {
    try {
      const response = await HttpClient.post<{
        data: {
          clientSecret: string;
          paymentMethodId: string;
          paymentIntentId: string;
          status: string;
          nextActionType: string;
        };
      }>(
        `/api/public/stripe/${paymentAccountUniqueId}/intent/create/pad`,
        payload,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating PAD payment intent:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new PaymentAccountService();
