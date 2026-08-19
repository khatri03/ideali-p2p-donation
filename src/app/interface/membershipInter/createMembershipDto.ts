export interface createMembershipDto {
  uniqueId: string; 
  rowVersion: number;
  name: string;
  description: string;
  organizerId: number;
  tenure: number;
  customExpiryDate: string; 
  availableForSignUp: boolean;
  isFree: boolean;
  membershipCharges: number;
  paymentAccountId: number;
  allowChequePayment: boolean;
  allowElectronicChequePayment: boolean;
  notifyOrganizer: boolean;
  otherNotificationEmails: string;
  expiresCalendarYear: boolean;
  requiresApproval: boolean;
  isDeleted: boolean;
  allowPartialPayment: boolean;
  customForms: number[];
}
