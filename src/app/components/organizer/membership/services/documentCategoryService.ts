import HttpClient from 'app/service/httpClient/HttpClient';

export interface DocumentCategoryItem {
  uniqueId: string;
  name: string;
  description: string | null;
  documentCount: number;
  allowDownload: boolean;
  membershipTypeNames: string[];
  createdOnUtc: string;
}

export interface DocumentCategoryData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: DocumentCategoryItem[];
}

export interface DocumentCategoryParams {
  pageNo?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface DocumentCategoryMembershipTypeOption {
  uniqueId: string;
  name: string;
  activeMemberCount: number;
}

export interface CreateDocumentCategoryPayload {
  name: string;
  description?: string;
  allowDownload?: boolean;
  membershipTypeUniqueIds: string[];
}

export interface UpdateDocumentCategoryPayload {
  name: string;
  description?: string;
  allowDownload: boolean;
  membershipTypeUniqueIds: string[];
}

export interface DocumentCategoryDocument {
  uniqueId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  description: string | null;
  uploadedOnUtc: string;
}

export interface DocumentCategoryDetail {
  uniqueId: string;
  name: string;
  description: string | null;
  allowDownload: boolean;
  membershipTypeUniqueIds: string[];
  documents: DocumentCategoryDocument[];
  createdOnUtc: string;
}

const documentCategoryService = {
  getList: async (params: DocumentCategoryParams = {}): Promise<DocumentCategoryData> => {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    });

    if (params.searchTerm?.trim()) {
      query.append('searchTerm', params.searchTerm.trim());
    }

    const response = await HttpClient.get<{ data: DocumentCategoryData }>(
      `/api/organizer/membership/document-category/list?${query.toString()}`,
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

  getMembershipTypeOptions: () =>
    HttpClient.get<{ data: DocumentCategoryMembershipTypeOption[]; success: boolean }>(
      '/api/organizer/membership/document-category/membership-type-options',
    ),

  getById: (uniqueId: string) =>
    HttpClient.get<{ data: DocumentCategoryDetail; success: boolean }>(
      `/api/organizer/membership/document-category/${uniqueId}`,
    ),

  create: (payload: CreateDocumentCategoryPayload) =>
    HttpClient.post<{ data: string; success: boolean; message: string | null }>(
      '/api/organizer/membership/document-category',
      payload,
    ),

  uploadDocuments: (categoryUniqueId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file, file.name));

    return HttpClient.post<{ success: boolean; message: string | null }>(
      `/api/organizer/membership/document-category/${categoryUniqueId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  update: (uniqueId: string, payload: UpdateDocumentCategoryPayload) =>
    HttpClient.put<{ success: boolean; message: string | null }>(
      `/api/organizer/membership/document-category/${uniqueId}`,
      payload,
    ),

  deleteCategory: (uniqueId: string) =>
    HttpClient.delete<{ success: boolean; message: string | null }>(
      `/api/organizer/membership/document-category/${uniqueId}`,
    ),

  downloadDocument: async (documentUniqueId: string, fallbackFileName = 'document'): Promise<void> => {
    const response = await HttpClient.get(
      `/api/organizer/membership/document-category/documents/${documentUniqueId}`,
      { responseType: 'blob' },
    );

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    let filename = fallbackFileName;
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

  deleteDocuments: (categoryUniqueId: string, documentUniqueIds: string[]) =>
    HttpClient.delete<{ success: boolean; message: string | null }>(
      `/api/organizer/membership/document-category/${categoryUniqueId}/documents`,
      { data: { documentUniqueIds } },
    ),
};

export default documentCategoryService;
