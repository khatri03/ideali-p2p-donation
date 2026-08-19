export interface moduleResponseDto {
  data: ModuleOption[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}
export interface ModuleOption {
  value: number;
  text: string;
}