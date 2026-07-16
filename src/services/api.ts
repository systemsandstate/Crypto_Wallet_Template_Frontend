import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { walletsForServerSync } from '../utils/walletSync';

const TOKEN_STORAGE_KEY = 'accessToken';

export interface Merchant {
  id: string;
  email: string;
  businessName: string;
  phone: string | null;
  avatarUrl?: string | null;
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
  source?: string;
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
  if (authToken) return authToken;
  if (Platform.OS === 'web') {
    authToken = readWebToken();
    return authToken;
  }
  authToken = await readNativeToken();
  return authToken;
}

/** Persist token to memory + storage (await on native so send cannot race AsyncStorage). */
export async function persistAuthToken(token: string | null): Promise<void> {
  authToken = token;
  writeWebToken(token);
  if (Platform.OS === 'web') return;
  try {
    if (token) await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Memory token remains valid for this session if storage fails.
  }
}

export async function ensureAuthToken(): Promise<string> {
  const token = await hydrateAuthToken();
  if (!token) throw new Error('Session expired');
  return token;
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
  writeWebToken(token);
  writeNativeToken(token);
  if (!token) clearApiCache();
};

export const getAuthToken = (): string | null => authToken;

const GET_CACHE_TTL_MS: Record<string, number> = {
  '/merchant/wallets/balances': 12_000,
  '/merchant/wallets/transfers': 20_000,
  '/payments/requests': 20_000,
  '/merchant/wallets': 60_000,
};

const getCacheTtl = (path: string): number | null => {
  if (/live=1|live=true/i.test(path)) return null;
  for (const [prefix, ttl] of Object.entries(GET_CACHE_TTL_MS)) {
    if (path.startsWith(prefix)) return ttl;
  }
  return null;
};

type CacheEntry = { at: number; data: unknown };
const responseCache = new Map<string, CacheEntry>();
const inflightGets = new Map<string, Promise<unknown>>();

export function clearApiCache(): void {
  responseCache.clear();
  inflightGets.clear();
}

/** Drop cached GET responses so history/balances refetch (e.g. after a receive). */
export function invalidateCachedGet(pathPrefix: string): void {
  for (const key of [...responseCache.keys()]) {
    if (key.startsWith(pathPrefix)) responseCache.delete(key);
  }
  for (const key of [...inflightGets.keys()]) {
    if (key.startsWith(pathPrefix)) inflightGets.delete(key);
  }
}

/** True when a cached GET response exists and is younger than maxAgeMs. */
export function isCachedGetFresh(path: string, maxAgeMs: number): boolean {
  const hit = responseCache.get(path);
  return Boolean(hit && Date.now() - hit.at < maxAgeMs);
}

async function cachedGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const ttl = getCacheTtl(path);
  if (ttl == null) return request<T>(path, options);

  const hit = responseCache.get(path);
  if (hit && Date.now() - hit.at < ttl) return hit.data as T;

  const pending = inflightGets.get(path);
  if (pending) return pending as Promise<T>;

  const promise = request<T>(path, options)
    .then((data) => {
      responseCache.set(path, { at: Date.now(), data });
      inflightGets.delete(path);
      return data;
    })
    .catch((err) => {
      inflightGets.delete(path);
      throw err;
    });

  inflightGets.set(path, promise);
  return promise;
}

const API_TIMEOUT_MS = Platform.OS === 'web' ? 25_000 : 30_000;

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const isPublicAuthPath = (path: string): boolean =>
  PUBLIC_AUTH_PATHS.some((prefix) => path.startsWith(prefix));

type RequestOptions = RequestInit & { suppressSessionExpired?: boolean };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { suppressSessionExpired, ...fetchOptions } = options;
  let token = getAuthToken();
  if (!token && !isPublicAuthPath(path)) {
    token = await hydrateAuthToken();
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  // Never attach a stale session token to login/register — avoids false "session expired".
  if (token && !isPublicAuthPath(path)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err || '');
    if (/aborted|abort/i.test(message)) {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token && !isPublicAuthPath(path)) {
    if (!suppressSessionExpired) {
      setAuthToken(null);
      onUnauthorized?.('Your session has expired. Please sign in again.');
    }
    throw new Error('Session expired');
  }

  if (!res.ok || data.success === false) {
    const message =
      data.error ||
      (res.status === 503 || res.status === 504
        ? 'Service temporarily unavailable. Please try again.'
        : res.status === 401
          ? 'Invalid email or password'
          : `Request failed (${res.status})`);
    throw new Error(message);
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

  getProfile: () =>
    request<{ success: boolean; data: Merchant }>('/merchant/profile', {
      suppressSessionExpired: true,
    }),

  updateProfile: (body: { businessName?: string; phone?: string | null; avatarUrl?: string | null }) =>
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

  listPayments: (params?: { status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const qs = q.toString();
    return cachedGet<{ success: boolean; data: { items: PaymentRequest[]; total: number } }>(
      `/payments/requests${qs ? `?${qs}` : ''}`
    );
  },

  getWalletStatus: () =>
    cachedGet<{ success: boolean; data: { hasWallet: boolean } }>('/merchant/wallets/status'),

  getWallets: () =>
    cachedGet<{ success: boolean; data: { wallets: MerchantWallet[]; hasWallet: boolean } }>(
      '/merchant/wallets'
    ),

  getWalletBalances: (params?: { live?: boolean }) => {
    const q = params?.live ? '?live=1' : '';
    return cachedGet<{
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
    }>(`/merchant/wallets/balances${q}`);
  },

  lookupWalletRecipient: (params: { address?: string; email?: string; network?: string }) => {
    const q = new URLSearchParams();
    if (params.email?.trim()) {
      q.set('email', params.email.trim().toLowerCase());
    } else if (params.address?.trim()) {
      q.set('address', params.address.trim());
    }
    if (params.network) q.set('network', params.network);
    return request<{
      success: boolean;
      data: {
        found: boolean;
        businessName?: string;
        merchantId?: string;
        avatarUrl?: string | null;
        network?: string;
        isSelf?: boolean;
        email?: string;
        addresses?: Partial<Record<string, string>>;
        defaultNetwork?: string;
        resolvedAddress?: string;
      };
    }>(`/merchant/wallets/recipient-lookup?${q.toString()}`);
  },

  getWalletTransfers: () =>
    cachedGet<{ success: boolean; data: { transfers: WalletTransfer[] } }>(
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
      {
        method: 'POST',
        body: JSON.stringify(body),
        suppressSessionExpired: true,
      }
    ),

  syncWallets: (wallets: Array<{ network: string; address: string }>) =>
    request<{ success: boolean; data: { wallets: MerchantWallet[] } }>('/merchant/wallets/sync', {
      method: 'POST',
      body: JSON.stringify({ wallets: walletsForServerSync(wallets) }),
    }),

  getGasFreeAccount: (ownerAddress: string) =>
    request<{
      success: boolean;
      data: {
        accountAddress: string;
        gasFreeAddress: string;
        active: boolean;
        nonce: number;
        allowSubmit: boolean;
      };
    }>(`/merchant/wallets/gasfree/${encodeURIComponent(ownerAddress.trim())}`),

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
