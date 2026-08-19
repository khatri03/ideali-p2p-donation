

export interface dateFormatResponseDto {
  data:  DateFormatOption[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface DateFormatOption {
  displayText: string;
  id: number;
}