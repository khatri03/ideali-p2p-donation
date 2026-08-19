

export interface timeZoneResponseDto {
  data:  timeZoneOption[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface timeZoneOption {
  displayName: string;
  id: number;
}