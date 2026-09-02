export interface SupporterSignUpRequest {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  /**
   * The code from the invitation this account is being created to accept. Absent when nobody invited
   * them. The server refuses the sign-up when it is live and the address does not match the invited
   * one, because that account could never accept the invitation afterwards.
   */
  invitationToken?: string;
}

export interface SupporterSignUpResponse {
  success: boolean;
  message?: string;
}
