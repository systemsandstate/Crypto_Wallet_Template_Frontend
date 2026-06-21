import { API_BASE_URL } from '../config/api';

export interface Merchant {
  id: string;
  email: string;
  businessName: string;
  phone: string | null;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PaymentRequest {
  id: string;
  amount: string;
  currency: string;
  network: string;
  reference: string | null;
  status: string;
  paymentUrl: string | null;
  qrCodeDataUrl: string | null;
  txHash: string | null;
  paidAmount: string | null;
  failureReason: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    merchant: Merchant;
    accessToken: string;
    expiresIn: string;
  };
}

let authToken: string | null = null;
let onUnauthorized: ((message: string) => void) | null = null;

export const setUnauthorizedHandler = (handler: ((message: string) => void) | null) => {
  onUnauthorized = handler;
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  if (typeof localStorage !== 'undefined') {
    authToken = localStorage.getItem('accessToken');
  }
  return authToken;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    setAuthToken(null);
    onUnauthorized?.('Your session has expired. Please sign in again.');
    throw new Error('Session expired');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  register: (body: {
    email: string;
    password: string;
    businessName: string;
    phone?: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  forgotPassword: (body: { email: string }) =>
    request<{ success: boolean; data: { message: string } }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: { token: string; newPassword: string }) =>
    request<{ success: boolean; data: { message: string } }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getProfile: () => request<{ success: boolean; data: Merchant }>('/merchant/profile'),

  updateProfile: (body: { businessName?: string; phone?: string | null }) =>
    request<{ success: boolean; data: Merchant }>('/merchant/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; data: { message: string } }>('/merchant/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  createPayment: (body: { amount: number; reference?: string; currency?: string; network?: string }) =>
    request<{ success: boolean; data: PaymentRequest }>('/payments/requests', {
      method: 'POST',
      body: JSON.stringify({
        amount: body.amount,
        reference: body.reference,
        currency: 'USDT',
        network: body.network || 'TRC20',
      }),
      headers: { 'Idempotency-Key': `${Date.now()}-${Math.random()}` },
    }),

  getPayment: (id: string) =>
    request<{ success: boolean; data: PaymentRequest }>(`/payments/requests/${id}`),

  cancelPayment: (id: string) =>
    request<{ success: boolean; data: PaymentRequest }>(`/payments/requests/${id}/cancel`, {
      method: 'POST',
    }),

  listPayments: (params?: { status?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return request<{ success: boolean; data: { items: PaymentRequest[]; total: number } }>(
      `/payments/requests${qs ? `?${qs}` : ''}`
    );
  },
};
