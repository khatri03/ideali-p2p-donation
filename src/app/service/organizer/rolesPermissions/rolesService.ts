import HttpClient from 'app/service/httpClient/HttpClient';

export interface PermissionItem {
  permissionId: number;
  permissionKey: string;
  action: string;
  description: string;
}

export interface ScreenCatalog {
  screenName: string;
  permissions: PermissionItem[];
}

export interface ModuleCatalog {
  moduleName: string;
  screens: ScreenCatalog[];
}

export interface PermissionCatalogData {
  modules: ModuleCatalog[];
}

export interface PermissionCatalogResponse {
  data: PermissionCatalogData;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface RoleListItem {
  roleUniqueId: string;
  name: string;
  permissionCount: number;
  assignedUserCount: number;
}

export interface RoleListData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: RoleListItem[];
}

export interface RoleListResponse {
  data: RoleListData;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface RoleDetailPermission {
  permissionId: number;
  permissionKey: string;
  action: string;
  description: string;
}

export interface RoleDetailScreen {
  screenName: string;
  permissions: RoleDetailPermission[];
}

export interface RoleDetailModule {
  moduleName: string;
  screens: RoleDetailScreen[];
}

export interface RoleDetail {
  roleUniqueId: string;
  name: string;
  hasPermissions: boolean;
  modules: RoleDetailModule[];
  assignedUsers: any[];
}

export interface RoleDetailResponse {
  data: RoleDetail;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface UpdateRoleRequest {
  name: string;
  permissionIds: number[];
}

export interface UpdateRoleResponse {
  data: any;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface CreateRoleRequest {
  name: string;
  permissionIds: number[];
}

export interface CreateRoleResponse {
  data: any;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

class PermissionCatalogService {
  async getPermissionCatalog(): Promise<PermissionCatalogData> {
    const response = await HttpClient.get<PermissionCatalogResponse>(
      '/api/identity/permission-catalog/list'
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch permission catalog');
  }

  async getRoleList(pageNo = 1, pageSize = 50): Promise<RoleListData> {
    const response = await HttpClient.get<RoleListResponse>(
      `/api/identity/role/list?pageNo=${pageNo}&pageSize=${pageSize}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch role list');
  }

  async getRoleDetail(roleUniqueId: string): Promise<RoleDetail> {
    const response = await HttpClient.get<RoleDetailResponse>(
      `/api/identity/role/${roleUniqueId}/detail`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch role detail');
  }

  async updateRole(roleUniqueId: string, payload: UpdateRoleRequest): Promise<UpdateRoleResponse> {
    const response = await HttpClient.post<UpdateRoleResponse>(
      `/api/identity/role/${roleUniqueId}/update`,
      payload
    );
    return response.data;
  }

  async createRole(payload: CreateRoleRequest): Promise<CreateRoleResponse> {
    const response = await HttpClient.post<CreateRoleResponse>(
      '/api/identity/role/create',
      payload
    );
    return response.data;
  }
}

export default new PermissionCatalogService();
