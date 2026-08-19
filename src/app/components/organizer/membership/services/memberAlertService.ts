import HttpClient from 'app/service/httpClient/HttpClient';

export interface MemberAlertItem {
  uniqueId: string;
  title: string;
  priority: string;
  channels: string;
  status: string;
  scheduledAtUtc: string | null;
  sentAtUtc: string | null;
  recipientCount: number;
  readCount: number;
  failedCount: number;
  createdBy: string;
  createdOnUtc: string;
}

export interface MemberAlertListData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: MemberAlertItem[];
}

export interface MemberAlertListParams {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AlertOption {
  value: string;
  text: string;
}

export interface AlertMembershipTypeOption {
  uniqueId: string;
  name: string;
  memberCount: number;
}

export interface CustomListPreviewMember {
  memberUniqueId: string;
  fullName: string;
  email: string;
  membershipTypeName: string;
  membershipStatus: string;
  addedOnUtc: string;
  otherLists: string[];
}

export interface CustomListPreviewData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: CustomListPreviewMember[];
}

export interface CustomListPreviewParams {
  pageNo?: number;
  pageSize?: number;
  customListUniqueIds: string[];
  membershipTypeUniqueIds?: string[];
  membershipStatuses?: string[];
}

export interface CreateAlertPayload {
  title: string;
  body: string;
  priority: string;
  channels: number;
  scheduledAtUtc: string | null;
  customListUniqueIds: string[];
  membershipStatuses: string[];
  membershipTypeUniqueIds: string[];
  recipientUniqueIds: string[];
}

export interface CreateAlertResponse {
  data: string;
  success: boolean;
  message: string | null;
}

export interface AlertActionResponse {
  success: boolean;
  message: string | null;
}

export interface AlertRecipientDelivery {
  channel: string;
  attemptNo: number;
  status: string;
  toEmail: string | null;
  failureReason: string | null;
  sentAtUtc: string | null;
  emailEvents: unknown[];
}

export interface AlertRecipient {
  uniqueId: string;
  name: string;
  email: string;
  isRead: boolean;
  readAtUtc: string | null;
  instantDeliveredAtUtc: string | null;
  deliveries: AlertRecipientDelivery[];
}

export interface AlertRecipientsData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: AlertRecipient[];
}

export interface AlertRecipientsParams {
  pageNo?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface AlertDetail {
  uniqueId: string;
  title: string;
  body: string;
  priority: string;
  channels: string;
  status: string;
  scheduledAtUtc: string | null;
  sentAtUtc: string | null;
  recipientCount: number;
  readCount: number;
  failedCount: number;
  createdBy: string;
  createdOnUtc: string;
  audienceRecipientUniqueIds: string[];
  audienceMembershipTypeUniqueIds: string[];
  audienceMembershipStatuses: string[];
  audienceCustomListUniqueIds: string[];
}

const memberAlertService = {
  getMembershipTypeOptions: () =>
    HttpClient.get<{ data: AlertMembershipTypeOption[]; success: boolean }>(
      '/api/organizer/membership/alert/membership-type-options',
    ),

  getMembershipStatusOptions: () =>
    HttpClient.get<{ data: AlertOption[]; success: boolean }>(
      '/api/organizer/membership/type/status-options',
    ),

  getList: async (params: MemberAlertListParams = {}): Promise<MemberAlertListData> => {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      pageNo: String(pageNo),
      pageSize: String(pageSize),
      sortBy: params.sortBy ?? 'sentAtUtc',
      sortOrder: params.sortOrder ?? 'desc',
    });

    const response = await HttpClient.get<{ data: MemberAlertListData }>(
      `/api/organizer/membership/alert/list?${query.toString()}`,
    );

    return (
      response.data.data ?? {
        pageNo,
        pageSize,
        pageCount: 0,
        totalRecordsCount: 0,
        pageData: [],
      }
    );
  },

  getCustomListPreview: async (params: CustomListPreviewParams): Promise<CustomListPreviewData> => {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    });

    params.customListUniqueIds.forEach((id) => query.append('customListUniqueIds', id));
    params.membershipTypeUniqueIds?.forEach((id) => query.append('membershipTypeUniqueIds', id));
    params.membershipStatuses?.forEach((s) => query.append('membershipStatuses', s));

    const response = await HttpClient.get<{ data: CustomListPreviewData }>(
      `/api/organizer/membership/alert/custom-list-preview?${query.toString()}`,
    );

    return (
      response.data.data ?? {
        pageNo,
        pageSize,
        pageCount: 0,
        totalRecordsCount: 0,
        pageData: [],
      }
    );
  },

  create: (payload: CreateAlertPayload) =>
    HttpClient.post<CreateAlertResponse>(
      '/api/organizer/membership/alert',
      payload,
    ),

  deleteAlert: (uniqueId: string) =>
    HttpClient.delete<AlertActionResponse>(
      `/api/organizer/membership/alert/${uniqueId}`,
    ),

  resend: (uniqueId: string) =>
    HttpClient.post<AlertActionResponse>(
      `/api/organizer/membership/alert/${uniqueId}/resend`,
    ),

  getById: (uniqueId: string) =>
    HttpClient.get<{ data: AlertDetail; success: boolean }>(
      `/api/organizer/membership/alert/${uniqueId}`,
    ),

  getRecipients: async (uniqueId: string, params: AlertRecipientsParams = {}): Promise<AlertRecipientsData> => {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    });
    if (params.searchTerm?.trim()) query.append('searchTerm', params.searchTerm.trim());

    const response = await HttpClient.get<{ data: AlertRecipientsData }>(
      `/api/organizer/membership/alert/${uniqueId}/recipients?${query.toString()}`,
    );

    return (
      response.data.data ?? {
        pageNo,
        pageSize,
        pageCount: 0,
        totalRecordsCount: 0,
        pageData: [],
      }
    );
  },
};

export default memberAlertService;
