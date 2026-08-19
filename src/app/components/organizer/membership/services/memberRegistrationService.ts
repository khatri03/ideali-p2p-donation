import axios from 'axios';
import HttpClient from 'app/service/httpClient/HttpClient';
import { MemberRegistrationInfo } from '../types';

const PublicClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberRegistrationPayload {
  ContactInfo: {
    Prefix: number;
    FirstName: string;
    MiddleName?: string;
    LastName: string;
    PrimaryEmail: string;
    CellPhone: string;
    Address: { StreetLine1: string; StreetLine2?: string; ZipCode: string };
  };
  UserInfo: { Email: string; Password: string; ConfirmPassword: string };
  AddressInfo: {
    StreetLine1: string; StreetLine2?: string; ZipCode: string;
    AddressType: number; CityName: string; CountryId: number; StateId: number;
  };
  InvoiceDetail: {
    InvoiceAmount: number;
    AmountBreakdown: {
      MembershipAmount: number; DiscountAmount: number; FinalAmount: number;
      TipAmount: number; ApplicationFeeAmount: number; TotalAmount: number;
    };
    PaymentMethod: number;
    PaymentMethodDetail: { PaymentMethodId: string; CardHolderName: string };
  };
  CustomQuestionResponses: Array<{ QuestionUniqueId: string; OptionUniqueId?: string; Value: string }>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const memberRegistrationService = {
  // ── Form lookup APIs (used in Step 2 & 3 dropdowns) ──────────────────────
  getCountryList: () =>
    PublicClient.get<{ data: Array<{ countryId: number; name: string }> }>(
      '/api/geo/public/country/list',
    ),

  getStatesByCountry: (countryId: number) =>
    PublicClient.get<{ data: Array<{ countryInfo: { countryId: number; name: string };
      states: Array<{ stateId: number; name: string }> }> }>(
      `/api/geo/public/country/${countryId}/states`,
    ),

  getContactPrefixes: () =>
    HttpClient.get<{ data: Array<{ text: string; value: number }> }>(
      '/api/admin/list-items/contact-prefixes',
    ),

  getAddressTypes: () =>
    HttpClient.get<{ data: Array<{ text: string; value: number }> }>(
      '/api/admin/list-items/address-types',
    ),

  // ── Registration flow APIs ────────────────────────────────────────────────
  getMemberRegistrationInfo: (membershipId: string) =>
    PublicClient.get<{ data: MemberRegistrationInfo; success: boolean; message?: string }>(
      `/api/membership/${membershipId}/register`,
    ),

  fetchStripePublicCredentials: (paymentAccountUniqueId: string) =>
    PublicClient.get<{ data: { publishableKey: string; stripeAccount: string }; success: boolean }>(
      `/api/organizer/payment-account/pci/${paymentAccountUniqueId}/credentials`,
    ),

  validateCoupon: (membershipId: string, couponCode: string, membershipCharges: number) =>
    PublicClient.post<{
      data: { isValid: boolean; couponUniqueId: string; discountType: string;
        discountValue: number; maxDiscountAmount: number; discountAmount: number; finalAmount: number };
      success: boolean; message?: string;
    }>(`/api/membership/${membershipId}/validate-coupon`, { couponCode, membershipCharges }),

  registerMember: (membershipId: string, formData: FormData) =>
    PublicClient.post<{ data: any; success: boolean; message?: string }>(
      `/api/membership/${membershipId}/register`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),
};

export default memberRegistrationService;
