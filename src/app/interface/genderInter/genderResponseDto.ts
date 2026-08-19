export interface genderResponseDto {
  data: GenderOption[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface GenderOption {
  text: string;
  value: number;
}