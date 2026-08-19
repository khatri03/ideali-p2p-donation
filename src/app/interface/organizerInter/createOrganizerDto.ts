
export interface createOrganizerDto {
  organizerInfo: {
    organizerName: string;
    shortName: string;
    categoryId: number;
    dateFormatId: number;
    use24Hours: boolean;
    modules: number[];
    paymentMerchants: number[];
    timeZoneId: number;
    website: string;
  };
  userInfo: {
    email: string;
    password: string;
    confirmPassword: string;
  };
  contactDetail: {
    prefix: number;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: number;
    maritalStatus: number;
    ssn: string | null;
    dob: string; // ISO 8601 date string
    primaryEmail: string;
    secondaryEmail: string | null;
    workEmail: string | null;
    cellPhone: string;
    workPhone: string;
    homePhone: string;
  };
  addressInfo: {
    streetLine1: string;
    streetLine2: string;
    zipCode: string;
    countryId: number;
    stateId: number;
    city: string;
  };
}
