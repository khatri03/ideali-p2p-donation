
export interface GenericResponseDto {
    success: boolean;
    message: string | null;
    errorCode: string | null;
    validationErrors: any | null;
    meta: any | null;
    timestamp: string;
}