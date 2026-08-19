import HttpClient from 'app/service/httpClient/HttpClient';

export interface UserListItem {
  userId: string;
  userName: string;
  displayName: string;
  roles: string[];
}

export interface UserListData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: UserListItem[];
}

export interface UserListResponse {
  data: UserListData;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  confirmPassword: string;
  roleIds: string[];
}

export interface CreateUserResponse {
  data: any;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  userName: string;
  roleIds: string[];
}

export interface UpdateUserResponse {
  data: any;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface UserDetail {
  uniqueId: string;
  userName: string;
  firstName: string;
  lastName: string;
  roles: { roleId: string; roleName: string }[];
}

export interface UserDetailResponse {
  data: UserDetail;
  success: boolean;
  message: string | null;
}

class UserListService {
  async createUser(payload: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await HttpClient.post<CreateUserResponse>(
      '/api/identity/account/create',
      payload
    );
    return response.data;
  }

  async updateUser(userUniqueId: string, payload: UpdateUserRequest): Promise<UpdateUserResponse> {
    const response = await HttpClient.post<UpdateUserResponse>(
      `/api/identity/account/${userUniqueId}/update`,
      payload
    );
    return response.data;
  }


  async getUserDetail(userUniqueId: string): Promise<UserDetail> {
    const response = await HttpClient.get<UserDetailResponse>(
      `/api/identity/account/${userUniqueId}/user`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch user detail');
  }

  async getUserList(pageNo = 1, pageSize = 50): Promise<UserListData> {
    const response = await HttpClient.get<UserListResponse>(
      `/api/identity/account/user/list?pageNo=${pageNo}&pageSize=${pageSize}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch user list');
  }
}

export default new UserListService();
