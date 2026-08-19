import { useEffect, useRef } from 'react';
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
} from '@microsoft/signalr';
import memberNotificationService from '../services/memberNotificationService';

// Same base as the REST API — not a separate host (mirrors ideali-event-module's
// useAlertRealtime). VITE_API_BASE_URL carries a trailing slash in this repo's
// env files, so strip it before appending the hub path.
const HUB_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/+$/, '');
const HUB_URL = `${HUB_BASE}/hubs/alerts`;

// Rapid pushes within this window are coalesced into a single toast.
const COALESCE_MS = 800;

interface UseAlertRealtimeOptions {
  enabled: boolean;
  onAlerts: (count: number) => void; // fired with the coalesced count of pushes
  onRefresh: () => void; // re-fetch inbox/summary — called on push and on reconnect
}

// Fast path only — never load-bearing. If the hub fails to connect or auth
// (e.g. the backend hub expects a bearer token instead of the withCredentials
// cookie — unconfirmed against this project's backend), the failure is caught
// and logged; the bell's 120s backstop poll (see NotificationBell.tsx) keeps
// counts correct regardless.
export function useAlertRealtime({ enabled, onAlerts, onRefresh }: UseAlertRealtimeOptions) {
  const connectionRef = useRef<HubConnection | null>(null);
  const pendingCountRef = useRef(0);
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        withCredentials: true,
        // This app authenticates REST calls with a bearer JWT (see
        // HttpClient.ts's request interceptor), not a shared cookie — the hub
        // needs the same token or it 401s and the connection silently fails.
        accessTokenFactory: () => localStorage.getItem('AuthToken') || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    function queueToast(count: number) {
      pendingCountRef.current += count;
      if (coalesceTimerRef.current) clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = setTimeout(() => {
        const total = pendingCountRef.current;
        pendingCountRef.current = 0;
        if (total > 0) onAlerts(total);
      }, COALESCE_MS);
    }

    connection.on('alertReceived', () => {
      onRefresh();
      queueToast(1);
    });

    connection.onreconnected(() => {
      onRefresh();
      memberNotificationService.claimPendingInstantToasts().then((count) => {
        if (count > 0) queueToast(count);
      });
    });

    connection.start().catch((err) => {
      console.warn('[alerts] SignalR connection failed, falling back to polling:', err);
    });

    // Catch anything sent while previously offline.
    memberNotificationService.claimPendingInstantToasts().then((count) => {
      if (count > 0) queueToast(count);
    });

    return () => {
      if (coalesceTimerRef.current) clearTimeout(coalesceTimerRef.current);
      connection.stop();
      connectionRef.current = null;
    };
  }, [enabled]);
}
