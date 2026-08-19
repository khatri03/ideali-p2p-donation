import HttpClient from '../httpClient/HttpClient';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface NotificationListItem {
  id: number;
  subject: string;
  content: string;
  status: string;
  sentAt: string;
  createdAt: string;
  createdBy: string;
  recipientCount: number;
  organizerNames: string[];
}

export interface NotificationListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: NotificationListItem[];
}

export interface CreateNotificationRequest {
  subject: string;
  content: string;
  organizerUniqueIds: string[];
}

export interface EditNotificationRequest {
  subject: string;
  content: string;
  organizerUniqueIds: string[];
}

export interface NotificationRecipientStatus {
  id: number;
  status: string;
  isRead: boolean;
  readAt: string | null;
  failureReason: string | null;
  updatedAt: string;
}

export interface NotificationDetailRecipient {
  id: number;
  notificationId: number;
  organizerId: number;
  organizerName: string;
  deliveredAt: string;
  latestStatus: NotificationRecipientStatus;
}

export interface NotificationDetail {
  id: number;
  subject: string;
  content: string;
  status: string;
  sentAt: string;
  createdAt: string;
  createdBy: string;
  recipientCount: number;
  organizerNames: string[];
  recipients: NotificationDetailRecipient[];
}

export interface NotificationApiResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class NotificationService {
  async getNotifications(
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<NotificationListResponse> {
    try {
      const response = await HttpClient.get<NotificationApiResponse<NotificationListResponse>>(
        `/api/admin/notification/list?pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      return response.data?.data ?? (response.data as unknown as NotificationListResponse);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async createNotification(
    data: CreateNotificationRequest
  ): Promise<NotificationApiResponse<number>> {
    try {
      const response = await HttpClient.post<NotificationApiResponse<number>>(
        '/api/admin/notification/create',
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotificationDetail(notificationId: number): Promise<NotificationDetail> {
    try {
      const response = await HttpClient.get<NotificationApiResponse<NotificationDetail>>(
        `/api/admin/notification/${notificationId}/detail`
      );
      return response.data?.data ?? (response.data as unknown as NotificationDetail);
    } catch (error: any) {
      console.error('Error fetching notification detail:', error);
      throw error;
    }
  }

  async editNotification(
    notificationId: number,
    data: EditNotificationRequest
  ): Promise<NotificationApiResponse<any>> {
    try {
      const response = await HttpClient.put<NotificationApiResponse<any>>(
        `/api/admin/notification/${notificationId}/edit`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Error editing notification:', error);
      throw error;
    }
  }

  async resendNotification(notificationId: number): Promise<NotificationApiResponse<any>> {
    try {
      const response = await HttpClient.post<NotificationApiResponse<any>>(
        `/api/admin/notification/${notificationId}/resend`,
        {}
      );
      return response.data;
    } catch (error: any) {
      console.error('Error resending notification:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: number): Promise<NotificationApiResponse<any>> {
    try {
      const response = await HttpClient.delete<NotificationApiResponse<any>>(
        `/api/admin/notification/${notificationId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async archiveNotification(notificationId: number): Promise<NotificationApiResponse<any>> {
    try {
      const response = await HttpClient.delete<NotificationApiResponse<any>>(
        `/api/admin/notification/${notificationId}/archive`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();
