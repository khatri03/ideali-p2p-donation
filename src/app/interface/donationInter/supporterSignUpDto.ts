export interface SupporterSignUpRequest {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
}

export interface SupporterSignUpResponse {
  success: boolean;
  message?: string;
}
