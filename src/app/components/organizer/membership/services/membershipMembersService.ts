import HttpClient from 'app/service/httpClient/HttpClient';
import { getFileExtension } from 'app/components/organizer/donation/organizerDonationComponents/helperFuntions';

export interface MemberListItem {
  uniqueId: string;
  memberFullName: string;
  activeMembershipName: string;
  membershipStatus: string;
  email: string;
  membershipExpiryUtc: string | null;
}

export interface MemberListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: MemberListItem[];
}

export interface MemberListParams {
  pageNo?: number;
  pageSize?: number;
  searchTerm?: string;
  membershipTypeUniqueIds?: string[];
  membershipStatuses?: string[];
}

const membershipMembersService = {
  getMemberStatusOptions: () =>
    HttpClient.get<{ data: Array<{ value: string; text: string }>; success: boolean }>(
      '/api/organizer/membership/type/status-options',
    ),

  getMembershipTypeOptions: () =>
    HttpClient.get<{ data: Array<{ value: string; text: string }>; success: boolean }>(
      '/api/organizer/membership/type/options',
    ),

  getMembers: (params: MemberListParams) => {
    const query = new URLSearchParams();
    if (params.pageNo)     query.append('pageNo',     String(params.pageNo));
    if (params.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params.searchTerm) query.append('searchTerm', params.searchTerm);
    params.membershipTypeUniqueIds?.forEach((id) => query.append('membershipTypeUniqueIds', id));
    params.membershipStatuses?.forEach((s) => query.append('membershipStatuses', s));

    return HttpClient.get<{ data: MemberListResponse; success: boolean }>(
      `/api/organizer/membership/type/members?${query.toString()}`,
    );
  },

  // Export member list (exportFormat: 'Csv' | 'Excel')
  exportMembers: async (exportFormat: string, params: MemberListParams): Promise<void> => {
    const query = new URLSearchParams();
    if (params.pageNo)     query.append('pageNo',     String(params.pageNo));
    if (params.pageSize)   query.append('pageSize',   String(params.pageSize));
    if (params.searchTerm) query.append('searchTerm', params.searchTerm);
    params.membershipTypeUniqueIds?.forEach((id) => query.append('membershipTypeUniqueIds', id));
    params.membershipStatuses?.forEach((s) => query.append('membershipStatuses', s));

    const response = await HttpClient.get(
      `/api/organizer/membership/type/members/${exportFormat}/export?${query.toString()}`,
      { responseType: 'blob' },
    );

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    const fileExtension = getFileExtension(exportFormat);
    let filename = `Membership_Members_List_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export default membershipMembersService;
