import { AppState, AppStateStatus, Platform } from 'react-native';
import type { PaymentRequest } from './api';
import { getAuthToken } from './api';
import { API_BASE_URL } from '../config/api';

export type PaymentStreamHandler = (payment: PaymentRequest) => void;

const POLL_INTERVAL_MS = 4000;
const SSE_RECONNECT_DELAY_MS = 2500;

const streamUrl = (paymentId: string, token: string): string =>
  `${API_BASE_URL}/payments/requests/${paymentId}/stream?token=${encodeURIComponent(token)}`;

const parseStreamPayload = (raw: string | null | undefined): PaymentRequest | null => {
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    if (payload?.payment) return payload.payment as PaymentRequest;
  } catch {
    // ignore malformed events
  }
  return null;
};

type CleanupFn = () => void;

const startPolling = (
  paymentId: string,
  onUpdate: PaymentStreamHandler,
  isActive: () => boolean
): CleanupFn => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const fetchPayment = async (): Promise<PaymentRequest | null> => {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/payments/requests/${paymentId}`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) return null;
    return data.data as PaymentRequest;
  };

  const tick = async () => {
    if (!isActive()) return;
    try {
      const payment = await fetchPayment();
      if (payment) {
        onUpdate(payment);
        if (payment.status !== 'PENDING') return;
      }
    } catch {
      // keep polling on transient errors
    }
    if (isActive()) {
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    }
  };

  void tick();

  return () => {
    if (timer) clearTimeout(timer);
  };
};

const startWebSse = (
  paymentId: string,
  token: string,
  onUpdate: PaymentStreamHandler,
  onDisconnect: () => void,
  isActive: () => boolean
): CleanupFn => {
  const source = new EventSource(streamUrl(paymentId, token));

  source.onmessage = (event) => {
    const payment = parseStreamPayload(event.data);
    if (payment) onUpdate(payment);
  };

  source.onerror = () => {
    source.close();
    if (isActive()) onDisconnect();
  };

  return () => source.close();
};

const startNativeSse = (
  paymentId: string,
  token: string,
  onUpdate: PaymentStreamHandler,
  onDisconnect: () => void,
  isActive: () => boolean
): CleanupFn => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EventSource = require('react-native-sse').default as new (
    url: string,
    options?: { headers?: Record<string, string>; pollingInterval?: number }
  ) => {
    addEventListener: (type: string, listener: (event: { data?: string }) => void) => void;
    removeAllEventListeners: (type: string) => void;
    close: () => void;
  };

  const es = new EventSource(streamUrl(paymentId, token), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    pollingInterval: 0,
  });

  const onMessage = (event: { data?: string }) => {
    const payment = parseStreamPayload(event.data);
    if (payment) onUpdate(payment);
  };

  const onError = () => {
    es.close();
    if (isActive()) onDisconnect();
  };

  es.addEventListener('message', onMessage);
  es.addEventListener('error', onError);

  return () => {
    es.removeAllEventListeners('message');
    es.removeAllEventListeners('error');
    es.close();
  };
};

/**
 * Real-time payment status: SSE on web + native, polling fallback, AppState reconnect.
 */
export function subscribePaymentStream(
  paymentId: string,
  onUpdate: PaymentStreamHandler,
  onError?: (err: Error) => void
): CleanupFn {
  let active = true;
  let mode: 'sse' | 'poll' = 'sse';
  let stopSse: CleanupFn | null = null;
  let stopPoll: CleanupFn | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let appStateSub: { remove: () => void } | null = null;

  const isActive = () => active;

  const stopAll = () => {
    stopSse?.();
    stopSse = null;
    stopPoll?.();
    stopPoll = null;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const handleUpdate: PaymentStreamHandler = (payment) => {
    onUpdate(payment);
    if (payment.status !== 'PENDING') {
      active = false;
      stopAll();
      appStateSub?.remove();
    }
  };

  const startPollFallback = () => {
    if (!active || mode === 'poll') return;
    mode = 'poll';
    stopSse?.();
    stopSse = null;
    stopPoll = startPolling(paymentId, handleUpdate, isActive);
  };

  const onSseDisconnect = () => {
    onError?.(new Error('Payment stream disconnected — using polling'));
    startPollFallback();
  };

  const connectSse = (token: string) => {
    if (!active || mode === 'poll') return;

    stopSse?.();
    stopSse =
      Platform.OS === 'web'
        ? startWebSse(paymentId, token, handleUpdate, onSseDisconnect, isActive)
        : startNativeSse(paymentId, token, handleUpdate, onSseDisconnect, isActive);
  };

  const scheduleReconnect = (token: string) => {
    if (!active || mode === 'poll') return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectSse(token);
    }, SSE_RECONNECT_DELAY_MS);
  };

  const token = getAuthToken();
  if (!token) {
    stopPoll = startPolling(paymentId, handleUpdate, isActive);
    onError?.(new Error('Not signed in — using polling'));
    return () => {
      active = false;
      stopAll();
    };
  }

  connectSse(token);

  if (Platform.OS !== 'web') {
    appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (!active) return;

      if (next === 'active' && mode === 'sse') {
        scheduleReconnect(token);
      } else if (next === 'background' || next === 'inactive') {
        stopSse?.();
        stopSse = null;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      }
    });
  }

  return () => {
    active = false;
    stopAll();
    appStateSub?.remove();
  };
}
