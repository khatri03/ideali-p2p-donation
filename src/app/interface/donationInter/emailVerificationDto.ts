export interface EmailVerificationRequest {
  token: string;
}

export interface ResendVerificationRequest {
  emailAddress: string;
}

export interface EmailVerificationResult {
  campaignUniqueId: string;
  campaignName: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message?: string;
  data?: EmailVerificationResult;
}
