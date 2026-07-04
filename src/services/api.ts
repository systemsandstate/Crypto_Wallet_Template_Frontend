import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const TOKEN_STORAGE_KEY = 'accessToken';

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
  depositAddress: string | null;
  paymentUrl: string | null;
  qrCodeDataUrl: string | null;
  txHash: string | null;
  paidAmount: string | null;
  failureReason: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface MerchantWallet {
  id: string;
  network: string;
  address: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransfer {
  id: string;
  type: 'DEPOSIT' | 'SEND';
  network: string;
  amount: number;
  currency: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  blockNumber: number;
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

const readWebToken = (): string | null => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeWebToken = (token: string | null) => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const readNativeToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeNativeToken = (token: string | null) => {
  if (Platform.OS === 'web') return;
  if (token) void AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  else void AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
};

export async function hydrateAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    authToken = readWebToken();
    return authToken;
  }
  authToken = await readNativeToken();
  return authToken;
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
  writeWebToken(token);
  writeNativeToken(token);
};

export const getAuthToken = (): string | null => authToken;

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

  verifyPassword: (body: { password: string }) =>
    request<{ success: boolean; data: { verified: boolean } }>('/merchant/verify-password', {
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

  getWalletStatus: () =>
    request<{ success: boolean; data: { hasWallet: boolean } }>('/merchant/wallets/status'),

  getWallets: () =>
    request<{ success: boolean; data: { wallets: MerchantWallet[]; hasWallet: boolean } }>(
      '/merchant/wallets'
    ),

  getWalletBalances: () =>
    request<{
      success: boolean;
      data: {
        balances: Array<{
          network: string;
          address: string;
          usdtBalance: number | null;
          nativeBalance: number | null;
          nativeSymbol: string;
        }>;
      };
    }>('/merchant/wallets/balances'),

  getWalletTransfers: () =>
    request<{ success: boolean; data: { transfers: WalletTransfer[] } }>(
      '/merchant/wallets/transfers'
    ),

  reportWalletSend: (body: {
    network: string;
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    currency: string;
    blockNumber?: number;
  }) =>
    request<{ success: boolean; data: { recorded: boolean } }>(
      '/merchant/wallets/transfers/report',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  syncWallets: (wallets: Array<{ network: string; address: string }>) =>
    request<{ success: boolean; data: { wallets: MerchantWallet[] } }>('/merchant/wallets/sync', {
      method: 'POST',
      body: JSON.stringify({ wallets }),
    }),

  registerPushToken: (body: { token: string; platform?: string }) =>
    request<{ success: boolean; data: { registered: boolean } }>('/merchant/push-token', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  removePushToken: (body: { token: string }) =>
    request<{ success: boolean; data: { removed: boolean } }>('/merchant/push-token', {
      method: 'DELETE',
      body: JSON.stringify(body),
    }),

  sendTestPush: () =>
    request<{ success: boolean; data: { sent: number } }>('/merchant/push-token/test', {
      method: 'POST',
    }),
};
