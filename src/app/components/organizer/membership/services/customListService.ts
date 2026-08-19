import HttpClient from 'app/service/httpClient/HttpClient';

export interface CustomListItem {
  uniqueId: string;
  name: string;
  memberCount: number;
  createdOnUtc: string;
}

export interface CustomListOption {
  uniqueId: string;
  name: string;
  memberCount: number;
}

export interface CustomListMembershipTypeOption {
  uniqueId: string;
  name: string;
  activeMemberCount: number;
}

export interface CustomListMemberOption {
  uniqueId?: string;
  memberUniqueId?: string;
  membershipMemberUniqueId?: string;
  participantUniqueId?: string;
  userUniqueId?: string;
  fullName?: string;
  memberFullName?: string;
  name?: string;
  email?: string;
  membershipTypeUniqueId?: string;
  membershipUniqueId?: string;
  activeMembershipUniqueId?: string;
  membershipTypeName?: string;
  activeMembershipName?: string;
  addedOnUtc?: string;
  createdOnUtc?: string;
  alsoIn?: string[];
  alsoInCustomLists?: string[];
  customListNames?: string[];
}

export interface CustomListData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: CustomListItem[];
}

export interface CustomListParams {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customListUniqueIds?: string[];
  name?: string;
}

export interface CustomListMemberOptionParams {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  membershipTypeUniqueIds?: string[];
}

export interface CustomListMemberOptionData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: CustomListMemberOption[];
}

export interface CreateCustomListPayload {
  name: string;
  memberUniqueIds: string[];
}

export interface CustomListDetail {
  uniqueId?: string;
  name?: string;
  memberUniqueIds?: string[];
  membershipTypeUniqueIds?: string[];
  members?: CustomListMemberOption[];
  selectedMembers?: CustomListMemberOption[];
  customListMembers?: CustomListMemberOption[];
  pageData?: CustomListMemberOption[];
}

const customListService = {
  getOptions: () =>
    HttpClient.get<{ data: CustomListOption[]; success: boolean }>(
      '/api/organizer/membership/custom-list/options',
    ),

  getMembershipTypeOptions: () =>
    HttpClient.get<{ data: CustomListMembershipTypeOption[]; success: boolean }>(
      '/api/organizer/membership/custom-list/membership-type-options',
    ),

  getMemberOptions: async (params: CustomListMemberOptionParams): Promise<CustomListMemberOptionData> => {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      pageNo: String(pageNo),
      pageSize: String(pageSize),
      sortBy: params.sortBy ?? 'fullName',
      sortOrder: params.sortOrder ?? 'asc',
    });

    params.membershipTypeUniqueIds?.forEach((id) => query.append('membershipTypeUniqueIds', id));

    const response = await HttpClient.get<{ data: CustomListMemberOptionData | CustomListMemberOption[] }>(
      `/api/organizer/membership/custom-list/member-options?${query.toString()}`,
    );

    const data = response.data.data;

    if (Array.isArray(data)) {
      return {
        pageNo,
        pageSize,
        pageCount: Math.ceil(data.length / pageSize),
        totalRecordsCount: data.length,
        pageData: data,
      };
    }

    return (
      data ?? {
        pageNo,
        pageSize,
        pageCount: 0,
        totalRecordsCount: 0,
        pageData: [],
      }
    );
  },

  getMembers: async (
    uniqueId: string,
    params: Omit<CustomListMemberOptionParams, 'membershipTypeUniqueIds'> = {},
  ): Promise<CustomListMemberOptionData> => {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      pageNo: String(pageNo),
      pageSize: String(pageSize),
      sortBy: params.sortBy ?? 'fullName',
      sortOrder: params.sortOrder ?? 'asc',
    });

    const response = await HttpClient.get<{ data: CustomListMemberOptionData | CustomListMemberOption[] }>(
      `/api/organizer/membership/custom-list/${uniqueId}/members?${query.toString()}`,
    );

    const data = response.data.data;

    if (Array.isArray(data)) {
      return {
        pageNo,
        pageSize,
        pageCount: Math.ceil(data.length / pageSize),
        totalRecordsCount: data.length,
        pageData: data,
      };
    }

    return (
      data ?? {
        pageNo,
        pageSize,
        pageCount: 0,
        totalRecordsCount: 0,
        pageData: [],
      }
    );
  },

  create: (payload: CreateCustomListPayload) =>
    HttpClient.post<{ data: string; success: boolean; message: string | null }>(
      '/api/organizer/membership/custom-list',
      payload,
    ),

  update: (uniqueId: string, payload: CreateCustomListPayload) =>
    HttpClient.put<{ data: string; success: boolean; message: string | null }>(
      `/api/organizer/membership/custom-list/${uniqueId}`,
      payload,
    ),

  deleteList: (uniqueId: string) =>
    HttpClient.delete<{ success: boolean; message: string | null }>(
      `/api/organizer/membership/custom-list/${uniqueId}`,
    ),

  rename: (uniqueId: string, name: string) =>
    HttpClient.post<{ success: boolean; message: string | null }>(
      `/api/organizer/membership/custom-list/${uniqueId}`,
      { name },
    ),

  addMembers: (uniqueId: string, memberUniqueIds: string[]) =>
    HttpClient.post<{ data: string | null; success: boolean; message: string | null }>(
      `/api/organizer/membership/custom-list/${uniqueId}/members`,
      { memberUniqueIds },
    ),

  getById: (uniqueId: string) =>
    HttpClient.get<{ data: CustomListDetail; success: boolean; message: string | null }>(
      `/api/organizer/membership/custom-list/${uniqueId}`,
    ),

  removeMembers: (uniqueId: string, memberUniqueIds: string[]) =>
    HttpClient.delete<{ data: string | null; success: boolean; message: string | null }>(
      `/api/organizer/membership/custom-list/${uniqueId}/members`,
      { data: { memberUniqueIds } },
    ),

  getList: async (params: CustomListParams = {}): Promise<CustomListData> => {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      pageNo: String(pageNo),
      pageSize: String(pageSize),
      sortBy: params.sortBy ?? 'name',
      sortOrder: params.sortOrder ?? 'asc',
    });

    params.customListUniqueIds?.forEach((id) => query.append('customListUniqueIds', id));
    if (params.name?.trim()) {
      const trimmedName = params.name.trim();
      query.append('searchTerm', trimmedName);
    }

    const response = await HttpClient.get<{ data: CustomListData }>(
      `/api/organizer/membership/custom-list/list?${query.toString()}`,
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

export default customListService;
