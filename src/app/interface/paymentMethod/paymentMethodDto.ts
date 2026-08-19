

export interface paymentMethodResponseDto {
  data: paymentMethodOption[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}
export interface paymentMethodOption {
  text: string;
  value: number;
}