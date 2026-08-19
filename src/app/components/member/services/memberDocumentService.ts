import HttpClient from 'app/service/httpClient/HttpClient';

export interface MemberDocumentCategory {
  uniqueId: string;
  name: string;
  description: string | null;
  documentCount: number;
}

interface MemberDocumentCategoryData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: MemberDocumentCategory[];
}

export interface MemberDocumentCategoryDetail {
  uniqueId: string;
  name: string;
  description: string | null;
  allowDownload: boolean;
}

export interface MemberDocument {
  uniqueId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  description: string | null;
  uploadedOnUtc: string;
}

interface MemberDocumentData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: MemberDocument[];
}

function triggerBlobDownload(data: BlobPart, headers: Record<string, any>, fallbackFileName: string) {
  const blob = new Blob([data]);
  const blobUrl = window.URL.createObjectURL(blob);

  let filename = fallbackFileName;
  const contentDisposition = headers['content-disposition'];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
  }

  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

const memberDocumentService = {
  getCategories: async (): Promise<MemberDocumentCategory[]> => {
    const response = await HttpClient.get<{ data: MemberDocumentCategoryData; success: boolean }>(
      '/api/member-documents/categories',
    );
    return response.data?.data?.pageData ?? [];
  },

  getCategoryDetail: async (categoryUniqueId: string): Promise<MemberDocumentCategoryDetail | null> => {
    const response = await HttpClient.get<{ data: MemberDocumentCategoryDetail; success: boolean }>(
      `/api/member-documents/categories/${categoryUniqueId}`,
    );
    return response.data?.data ?? null;
  },

  getCategoryDocuments: async (categoryUniqueId: string): Promise<MemberDocument[]> => {
    const response = await HttpClient.get<{ data: MemberDocumentData; success: boolean }>(
      `/api/member-documents/categories/${categoryUniqueId}/documents?pageNo=1&pageSize=200`,
    );
    return response.data?.data?.pageData ?? [];
  },

  downloadDocument: async (documentUniqueId: string, fallbackFileName = 'document'): Promise<void> => {
    const response = await HttpClient.get(
      `/api/member-documents/documents/${documentUniqueId}/download`,
      { responseType: 'blob' },
    );
    triggerBlobDownload(response.data, response.headers, fallbackFileName);
  },
};

export default memberDocumentService;
