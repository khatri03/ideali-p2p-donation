import HttpClient from '../../httpClient/HttpClient';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface OrganizerNotificationSummary {
  total: number;
  read: number;
  unread: number;
}

export interface OrganizerNotificationItem {
  recipientId: number;
  notificationId: number;
  subject: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  readAt: string | null;
  createdBy: string;
  deliveredAt: string;
}

export interface OrganizerNotificationListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: OrganizerNotificationItem[];
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class OrganizerNotificationService {
  async getSummary(): Promise<OrganizerNotificationSummary> {
    try {
      const response = await HttpClient.get<ApiResponse<OrganizerNotificationSummary>>(
        '/api/organizer/notifications/summary'
      );
      return response.data?.data ?? (response.data as unknown as OrganizerNotificationSummary);
    } catch (error: any) {
      console.error('Error fetching notification summary:', error);
      throw error;
    }
  }

  async pollNotifications(): Promise<OrganizerNotificationItem[]> {
    try {
      const response = await HttpClient.get<ApiResponse<OrganizerNotificationItem[]>>(
        '/api/organizer/notifications/poll'
      );
      return response.data?.data ?? [];
    } catch (error: any) {
      console.error('Error polling notifications:', error);
      throw error;
    }
  }

  async getNotifications(
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<OrganizerNotificationListResponse> {
    try {
      const response = await HttpClient.get<ApiResponse<OrganizerNotificationListResponse>>(
        `/api/organizer/notifications?pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      return response.data?.data ?? (response.data as unknown as OrganizerNotificationListResponse);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getNotificationDetail(recipientId: number): Promise<OrganizerNotificationItem> {
    try {
      const response = await HttpClient.get<ApiResponse<OrganizerNotificationItem>>(
        `/api/organizer/notifications/${recipientId}`
      );
      return response.data?.data ?? (response.data as unknown as OrganizerNotificationItem);
    } catch (error: any) {
      console.error('Error fetching notification detail:', error);
      throw error;
    }
  }

  async markAsRead(recipientId: number): Promise<ApiResponse<any>> {
    try {
      const response = await HttpClient.post<ApiResponse<any>>(
        `/api/organizer/notifications/${recipientId}/mark-as-read`,
        {}
      );
      return response.data;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(recipientId: number): Promise<ApiResponse<any>> {
    try {
      const response = await HttpClient.delete<ApiResponse<any>>(
        `/api/organizer/notifications/${recipientId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default new OrganizerNotificationService();
