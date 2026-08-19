

export interface paymentMerchantsResponseDto {
  data: PaymentMerchantsOption[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}
export interface PaymentMerchantsOption {
  value: string;
  text: number;
}
export interface PaymentMerchantsOption {
  id: string;
   name: number;
}

export interface PaymentMethodOption {
  value: number;
  text: string;
}

export interface PaymentMethodsResponseDto {
  data: PaymentMethodOption[];
  success: boolean;
  message?: string | null;
  errorCode?: string | null;
  validationErrors?: any;
  meta?: any;
  timestamp?: string;
}