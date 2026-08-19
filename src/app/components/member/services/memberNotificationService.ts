import HttpClient from 'app/service/httpClient/HttpClient';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type AlertPriority = 'Urgent' | 'Important' | 'Normal' | string;

export interface MemberNotificationItem {
  uniqueId: string;
  title: string;
  body: string;
  priority: AlertPriority;
  isSeen: boolean;
  seenAtUtc: string | null;
  isRead: boolean;
  readAtUtc: string | null;
  sentAtUtc: string;
  sentBy: string;
}

export interface MemberNotificationListResponse {
  pageNo: number;
  pageSize: number;
  pageCount: number;
  totalRecordsCount: number;
  pageData: MemberNotificationItem[];
}

export interface MemberNotificationSummary {
  total: number;
  read: number;
  unread: number;
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

// Matches the /api/alert-inbox/* contract from the current member-portal implementation
// (ideali-event-module) — string uniqueId, unseen vs read tracked separately.
const BASE = '/api/alert-inbox';

// ─── Service ──────────────────────────────────────────────────────────────────

class MemberNotificationService {
  async getAlerts(
    pageNo: number = 1,
    pageSize: number = 10,
    unreadOnly: boolean = false,
  ): Promise<MemberNotificationListResponse> {
    try {
      const response = await HttpClient.get<ApiResponse<MemberNotificationListResponse>>(
        `${BASE}/list?unreadOnly=${unreadOnly}&pageNo=${pageNo}&pageSize=${pageSize}`
      );
      return response.data?.data ?? (response.data as unknown as MemberNotificationListResponse);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  // Alias used by the list page (pageIndex === pageNo here).
  async getNotifications(
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<MemberNotificationListResponse> {
    return this.getAlerts(pageIndex, pageSize, false);
  }

  async getNotificationDetail(recipientUniqueId: string): Promise<MemberNotificationItem> {
    try {
      const response = await HttpClient.get<ApiResponse<MemberNotificationItem>>(
        `${BASE}/${recipientUniqueId}`
      );
      return response.data?.data ?? (response.data as unknown as MemberNotificationItem);
    } catch (error: any) {
      console.error('Error fetching alert detail:', error);
      throw error;
    }
  }

  // Dedicated unread count (list badge / stat card).
  async getUnreadCount(): Promise<number> {
    try {
      const response = await HttpClient.get<ApiResponse<number>>(`${BASE}/unread-count`);
      return response.data?.data ?? 0;
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Dedicated unseen count — this is what drives the bell badge specifically.
  async getUnseenCount(): Promise<number> {
    try {
      const response = await HttpClient.get<ApiResponse<number>>(`${BASE}/unseen-count`);
      return response.data?.data ?? 0;
    } catch (error: any) {
      console.error('Error fetching unseen count:', error);
      throw error;
    }
  }

  // Derived total/read from the dedicated unread-count endpoint plus a lightweight
  // list call (no dedicated "total" endpoint is exposed).
  async getSummary(): Promise<MemberNotificationSummary> {
    try {
      const [all, unread] = await Promise.all([
        this.getAlerts(1, 1, false),
        this.getUnreadCount(),
      ]);
      const total = all.totalRecordsCount;
      return { total, unread, read: Math.max(0, total - unread) };
    } catch (error: any) {
      console.error('Error fetching notification summary:', error);
      throw error;
    }
  }

  // Bulk "seen" — fired when the bell dropdown opens.
  async markAllSeen(): Promise<ApiResponse<any>> {
    try {
      const response = await HttpClient.post<ApiResponse<any>>(`${BASE}/seen`, {});
      return response.data;
    } catch (error: any) {
      console.error('Error marking alerts as seen:', error);
      throw error;
    }
  }

  // Single "read" — fired when an item is opened/viewed.
  async markAsRead(recipientUniqueId: string): Promise<ApiResponse<any>> {
    try {
      const response = await HttpClient.post<ApiResponse<any>>(
        `${BASE}/${recipientUniqueId}/read`,
        {}
      );
      return response.data;
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  // Catches alerts sent while the client was offline/disconnected — called once on
  // connect and again on every SignalR reconnect. Server-side dedup via InstantDeliveredAtUtc
  // makes this safe to call repeatedly.
  async claimPendingInstantToasts(): Promise<number> {
    try {
      const response = await HttpClient.post<ApiResponse<number>>(
        `${BASE}/instant-toasts/claim`,
        {}
      );
      return response.data?.data ?? 0;
    } catch (error: any) {
      console.error('Error claiming pending instant toasts:', error);
      return 0;
    }
  }
}

export default new MemberNotificationService();
