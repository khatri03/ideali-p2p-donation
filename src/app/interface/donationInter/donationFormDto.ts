export interface ContactInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  primaryEmail: string;
  cellPhone: string;
  gender: number | '';
  maritalStatus: number | '';
  dob: string;
}

export interface PaymentMethodDetail {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardHolderName: string;
}

export interface DonationFormData {
  donationAmount: number | '';
  frequency: 'OneTime' | 'Monthly' | 'Yearly';
  tipDescription: string;
  tipAmount: string;
  paymentMethod: string; 
  paymentMethodDetail: PaymentMethodDetail;
  contact: ContactInfo;
  notes?: string;
}

interface DonationSummaryProps {
  formData: DonationFormData;
  themeColor: string;
  textColor: string;
  subTextColor: string;
  onTipChange?: (tipAmount: string, tipDescription: string, totalAmount: string) => void;
}
