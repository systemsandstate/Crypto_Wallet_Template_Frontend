const trim = (value: string | undefined): string => (value ?? '').trim();

export const GASFREE_CHAIN_ID = 728126428;
export const GASFREE_VERIFYING_CONTRACT = 'TFFAMQLZybALaLb4uxHA9RBE7pxhUAjF3U';

export const gasFreeApiBaseUrl = (): string => {
  const raw = trim(process.env.EXPO_PUBLIC_GASFREE_API_URL);
  return raw.endsWith('/') ? raw : `${raw || 'https://open.gasfree.io/tron'}/`;
};

export const gasFreeApiKey = (): string => trim(process.env.EXPO_PUBLIC_GASFREE_API_KEY);
export const gasFreeApiSecret = (): string => trim(process.env.EXPO_PUBLIC_GASFREE_API_SECRET);

/** Optional override; otherwise fetched from GasFree `/api/v1/config/provider/all`. */
export const gasFreeServiceProviderOverride = (): string =>
  trim(process.env.EXPO_PUBLIC_GASFREE_SERVICE_PROVIDER);

export const tronRpcUrl = (): string =>
  trim(process.env.EXPO_PUBLIC_TRON_RPC_URL) || 'https://api.trongrid.io';

export function isGasFreeConfigured(): boolean {
  const key = gasFreeApiKey();
  const secret = gasFreeApiSecret();
  return Boolean(key && secret);
}
