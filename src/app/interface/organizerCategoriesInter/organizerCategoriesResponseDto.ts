export interface organizerCategoriesResponseDto {
  data: organizerCategoriesOption[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}
export interface organizerCategoriesOption {
  id: number;
  name: string;
}