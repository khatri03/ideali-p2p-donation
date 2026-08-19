export interface DonorData {
  campaignInfo: {
    id: string;
    name: string;
  };
  invoiceInfo: {
    invoiceNo: string;
    invoiceDateUtc: string;
    invoiceAmount: number;
  };
  contact: {
    prefix: number;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: number;
  };
}

export interface DonorListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: DonorData[];
}


export interface ApiResponse<T> {
  data: T;
}