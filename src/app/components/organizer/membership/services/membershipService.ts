import HttpClient from 'app/service/httpClient/HttpClient';
import { getFileExtension } from 'app/components/organizer/donation/organizerDonationComponents/helperFuntions';
import { MembershipListItem } from '../types';

export interface MembershipListData {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: MembershipListItem[];
}

const membershipService = {
  getList: async (pageNo = 1, pageSize = 10, searchTerm = ''): Promise<MembershipListData> => {
    const params = new URLSearchParams({ pageNo: String(pageNo), pageSize: String(pageSize) });
    if (searchTerm) params.set('searchTerm', searchTerm);

    const response = await HttpClient.get<{ data: MembershipListData }>(
      `/api/organizer/membership/type/list?${params.toString()}`,
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

  // Export membership type list (exportFormat: 'Csv' | 'Excel')
  exportMembershipTypeList: async (
    exportFormat: string,
    pageNo = 1,
    pageSize = 50,
    searchTerm = '',
  ): Promise<void> => {
    const params = new URLSearchParams({ pageNo: String(pageNo), pageSize: String(pageSize) });
    if (searchTerm) params.set('searchTerm', searchTerm);

    const response = await HttpClient.get(
      `/api/organizer/membership/type/list/${exportFormat}/export?${params.toString()}`,
      { responseType: 'blob' },
    );

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    const fileExtension = getFileExtension(exportFormat);
    let filename = `Membership_Type_List_${new Date().toISOString().split('T')[0]}.${fileExtension}`;

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

  createStripePaymentIntent: async (
    membershipId: string,
    payload: {
      totalAmount: number;
      paymentMethodId: string;
      payerInfo: {
        firstName: string;
        middleName?: string;
        lastName: string;
        primaryEmail: string;
        cellPhone: string;
      };
      tipDetail: {
        tipAmount: number;
        description: string;
      };
    },
  ): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    const response = await HttpClient.post<{ data: { clientSecret: string; paymentIntentId: string } }>(
      `/api/membership/${membershipId}/stripe/create-intent`,
      payload,
    );
    return response.data.data;
  },
};

export default membershipService;
