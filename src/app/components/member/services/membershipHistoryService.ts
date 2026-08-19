import HttpClient from 'app/service/httpClient/HttpClient';

interface MembershipHistoryApiItem {
  uniqueId: string;
  invoice: {
    invoiceNo: string;
    invoiceUniqueId: string;
    totalAmount: number;
    invoiceStatus: string;
    refundAmount: number | null;
    refundReason: string | null;
  } | null;
  organizerPhoto: { photoUrl: string | null } | null;
  contact: {
    prefix: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string;
    cellPhone: string;
  } | null;
  address: {
    streetLine1: string | null;
    streetLine2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zipCode: string | null;
  } | null;
  membership: {
    membershipTypeUniqueId: string;
    activeMembershipName: string;
    membershipStatus: string;
    membershipStartUtc: string;
    membershipExpiryUtc: string;
    notes: string | null;
  };
}

export interface MembershipHistoryAddress {
  streetLine1: string | null;
  streetLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
}

export interface MembershipHistoryContact {
  prefix: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  cellPhone: string;
}

export interface MembershipHistoryItem {
  uniqueId: string;
  membershipName: string;
  membershipStatus: string;
  membershipStartUtc: string;
  membershipExpiryUtc: string;
  invoiceNo: string;
  invoiceUniqueId: string;
  invoiceTotalAmount: number;
  invoiceStatus: string;
  refundAmount: number | null;
  refundReason: string | null;
  photoUrl: string | null;
  contact: MembershipHistoryContact | null;
  address: MembershipHistoryAddress;
}

const membershipHistoryService = {
  async getMembershipHistory(): Promise<MembershipHistoryItem[]> {
    try {
      const res = await HttpClient.get<{
        data: { pageNumber: number; pageSize: number; totalRecords: number; records: MembershipHistoryApiItem[] };
        success: boolean;
      }>(
        `/api/participant/membership/membership-history`,
      );
      return (res.data?.data?.records ?? []).map((item) => ({
        uniqueId: item.uniqueId,
        membershipName: item.membership.activeMembershipName,
        membershipStatus: item.membership.membershipStatus,
        membershipStartUtc: item.membership.membershipStartUtc,
        membershipExpiryUtc: item.membership.membershipExpiryUtc,
        invoiceNo: item.invoice?.invoiceNo ?? '',
        invoiceUniqueId: item.invoice?.invoiceUniqueId ?? '',
        invoiceTotalAmount: item.invoice?.totalAmount ?? 0,
        invoiceStatus: item.invoice?.invoiceStatus ?? '',
        refundAmount: item.invoice?.refundAmount ?? null,
        refundReason: item.invoice?.refundReason ?? null,
        photoUrl: item.organizerPhoto?.photoUrl ?? null,
        contact: item.contact
          ? {
              prefix: item.contact.prefix ?? null,
              firstName: item.contact.firstName,
              middleName: item.contact.middleName ?? null,
              lastName: item.contact.lastName,
              email: item.contact.email,
              cellPhone: item.contact.cellPhone,
            }
          : null,
        address: {
          streetLine1: item.address?.streetLine1 ?? null,
          streetLine2: item.address?.streetLine2 ?? null,
          city: item.address?.city ?? null,
          state: item.address?.state ?? null,
          country: item.address?.country ?? null,
          zipCode: item.address?.zipCode ?? null,
        },
      }));
    } catch {
      return [];
    }
  },
};

export default membershipHistoryService;
