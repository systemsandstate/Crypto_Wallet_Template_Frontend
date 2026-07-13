import { Platform } from 'react-native';
import { FetchRequest, JsonRpcProvider, Network, Wallet } from 'ethers';

import { API_BASE_URL } from '../../config/api';
import { attachNativeFetchRequest } from '../../polyfills/ethersFetch';
import { UsdtNetwork } from '../../constants/usdtNetworks';
import { getAuthToken, hydrateAuthToken } from '../api';
import {
  walletAddressesFromMnemonic,
  getPrivateKeyForNetwork,
  unlockMnemonicWithPin,
  WalletUnlockError,
} from './walletCore';
import {
  isWalletSetupLocally,
  saveWalletAddresses,
  hydrateLocalWalletAddresses,
  ensureLocalWalletForUnlock,
} from './walletStorage';
import { syncWalletAddressesInBackground } from './syncDeviceWallet';

const EVM_CHAIN_IDS: Partial<Record<UsdtNetwork, number>> = {
  ERC20: 1,
  BEP20: 56,
};

/** Public RPC endpoints for web (direct browser fetch). */
const WEB_RPC_URLS: Partial<Record<UsdtNetwork, string[]>> = {
  ERC20: [
    'https://ethereum.publicnode.com',
    'https://cloudflare-eth.com',
    'https://eth.llamarpc.com',
    'https://1rpc.io/eth',
  ],
  BEP20: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
  ],
};

export class WalletSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletSendError';
  }
}

export const EVM_SEND_NETWORKS: UsdtNetwork[] = ['ERC20', 'BEP20'];

export type SendProgressStep = 'preparing' | 'signing' | 'broadcasting';

const NATIVE_RPC_TIMEOUT_MS = 45_000;

const lastGoodWebRpcUrl: Partial<Record<UsdtNetwork, string>> = {};

export function createEvmProvider(network: UsdtNetwork, rpcUrl: string): JsonRpcProvider {
  const chainId = EVM_CHAIN_IDS[network];
  const networkConfig = chainId ? Network.from(chainId) : undefined;
  return new JsonRpcProvider(rpcUrl, networkConfig, { staticNetwork: true });
}

async function createNativeProxyProvider(network: UsdtNetwork): Promise<JsonRpcProvider> {
  const token = getAuthToken() ?? (await hydrateAuthToken());
  if (!token) {
    throw new WalletSendError('Session expired');
  }

  const chainId = EVM_CHAIN_IDS[network];
  const networkConfig = chainId ? Network.from(chainId) : undefined;
  const req = attachNativeFetchRequest(
    new FetchRequest(`${API_BASE_URL}/merchant/wallets/evm-rpc/${network}`),
    async () => getAuthToken() ?? (await hydrateAuthToken())
  );
  req.timeout = NATIVE_RPC_TIMEOUT_MS;
  req.setHeader('content-type', 'application/json');

  return new JsonRpcProvider(req, networkConfig, {
    staticNetwork: true,
    batchMaxCount: 1,
    batchStallTime: 0,
  });
}

/** Gas/fee fields for EVM sends — BSC prefers legacy gasPrice. */
export async function resolveTxFeeOverrides(
  provider: JsonRpcProvider
): Promise<Record<string, bigint>> {
  const feeData = await provider.getFeeData();
  if (feeData.gasPrice != null && feeData.gasPrice > 0n) {
    return { gasPrice: feeData.gasPrice };
  }
  if (feeData.maxFeePerGas != null && feeData.maxFeePerGas > 0n) {
    const priority =
      feeData.maxPriorityFeePerGas != null && feeData.maxPriorityFeePerGas > 0n
        ? feeData.maxPriorityFeePerGas
        : feeData.maxFeePerGas / 2n;
    return {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: priority,
    };
  }

  try {
    const gasPriceHex = await provider.send('eth_gasPrice', []);
    const gasPrice = BigInt(String(gasPriceHex));
    if (gasPrice > 0n) return { gasPrice };
  } catch {
    // fall through
  }

  return {};
}

export function getPublicEvmRpcUrl(network: UsdtNetwork): string | null {
  const preferred = lastGoodWebRpcUrl[network];
  const urls = WEB_RPC_URLS[network] || [];
  return preferred ?? urls[0] ?? null;
}

export async function resolveWalletRpcUrl(network: UsdtNetwork): Promise<string> {
  const token = getAuthToken() ?? (await hydrateAuthToken());
  if (token) {
    return `${API_BASE_URL}/merchant/wallets/evm-rpc/${network}`;
  }
  const urls = WEB_RPC_URLS[network] || [];
  const preferred = lastGoodWebRpcUrl[network];
  return preferred ?? urls[0] ?? '';
}

/**
 * Authenticated API JSON-RPC proxy first (same on web + mobile).
 * Web falls back to direct public RPC if the proxy fails.
 */
export async function withWalletRpc<T>(
  network: UsdtNetwork,
  fn: (provider: JsonRpcProvider) => Promise<T>
): Promise<T> {
  const token = getAuthToken() ?? (await hydrateAuthToken());
  if (token) {
    try {
      const provider = await createNativeProxyProvider(network);
      return await fn(provider);
    } catch (err) {
      if (err instanceof WalletSendError) throw err;
      if (Platform.OS !== 'web') throw mapSendError(err);
    }
  } else if (Platform.OS !== 'web') {
    throw new WalletSendError('Session expired');
  }

  const urls = WEB_RPC_URLS[network] || [];
  if (urls.length === 0) {
    throw new WalletSendError('Network RPC is not configured');
  }

  const preferred = lastGoodWebRpcUrl[network];
  const orderedUrls = preferred
    ? [preferred, ...urls.filter((url) => url !== preferred)]
    : urls;

  let lastError: unknown;
  for (const url of orderedUrls) {
    try {
      const provider = createEvmProvider(network, url);
      if (url !== preferred) {
        await provider.getBlockNumber();
      }
      const result = await fn(provider);
      lastGoodWebRpcUrl[network] = url;
      return result;
    } catch (err) {
      if (err instanceof WalletSendError) throw err;
      lastError = err;
      const message = err instanceof Error ? err.message : String(err || '');
      if (/insufficient|exceeds balance|transfer amount exceeds|nonce|replacement|user/i.test(message)) {
        throw mapSendError(err);
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError || '');
  if (/too many|rate|limit exceeded|unauthorized|detect network|failed to fetch/i.test(message)) {
    throw new WalletSendError('Network RPC is not configured');
  }
  throw mapSendError(lastError);
}

/** Avoid float noise like 0.10000000000000009 breaking parseUnits. */
export function toTokenAmountString(amount: number, maxDecimals: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new WalletSendError('Invalid amount');
  }
  const fixed = amount.toFixed(Math.min(maxDecimals, 8));
  const trimmed = fixed.replace(/\.?0+$/, '');
  return trimmed || '0';
}

export async function unlockWalletSigner(
  network: UsdtNetwork,
  pin: string,
  provider: JsonRpcProvider
): Promise<Wallet> {
  if (!EVM_SEND_NETWORKS.includes(network)) {
    throw new WalletSendError('Send is only supported on BEP20, ERC20, and Polygon for now');
  }

  if (!(await ensureLocalWalletForUnlock())) {
    throw new WalletSendError('Wallet not set up on this device');
  }

  let mnemonic: string;
  try {
    mnemonic = await unlockMnemonicWithPin(pin);
  } catch (err) {
    if (err instanceof WalletUnlockError) {
      if (err.code === 'WRONG_PIN') throw new WalletSendError('Invalid wallet PIN');
      throw new WalletSendError(err.message);
    }
    throw mapSendError(err);
  }

  const existingAddresses = await hydrateLocalWalletAddresses();
  const wallets = walletAddressesFromMnemonic(mnemonic);
  const existingTrc20 = existingAddresses?.find((row) => row.network === 'TRC20')?.address;
  const nextTrc20 = wallets.find((row) => row.network === 'TRC20')?.address;
  if (!existingAddresses?.length || existingTrc20 !== nextTrc20) {
    void saveWalletAddresses(wallets);
    void syncWalletAddressesInBackground(wallets);
  }

  const privateKey = getPrivateKeyForNetwork(mnemonic, network);
  return new Wallet(privateKey, provider);
}

export function mapSendError(err: unknown, fallback = 'Transaction failed'): WalletSendError {
  if (err instanceof WalletSendError) return err;

  const errObj = err as { code?: string; reason?: string; shortMessage?: string; message?: string };
  const parts = [errObj?.shortMessage, errObj?.reason, errObj?.message]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ');
  const message = parts || fallback;
  const lower = message.toLowerCase();

  if (/does not hold your funds|restore your recovery phrase/i.test(message)) {
    return new WalletSendError(message);
  }
  if (/insufficient funds|gas required|gas fee|intrinsic gas/i.test(lower)) {
    return new WalletSendError(
      'Not enough native coin for network fees (e.g. BNB on BEP20). Add a small amount and try again.'
    );
  }
  if (/exceeds balance|insufficient balance|transfer amount exceeds|bep20:|erc20:/i.test(lower)) {
    return new WalletSendError('Insufficient USDT balance for this transfer');
  }
  if (/call_exception|execution reverted|revert/i.test(lower)) {
    return new WalletSendError('Insufficient USDT balance for this transfer');
  }
  if (/session expired|invalid or expired token|access token required|unauthorized/i.test(lower)) {
    return new WalletSendError('Session expired');
  }
  if (/too many|rate|limit exceeded|detect network|failed to fetch|network error|network request failed|network request timed out|timeout|aborted/i.test(lower)) {
    return new WalletSendError('Network RPC is not configured');
  }
    if (/crypto\.getrandomvalues|getrandomvalues|randombytes|textencoder|textdecoder|buffer is not defined|property ['\"]buffer['\"]/i.test(lower)) {
    return new WalletSendError(
      'This device is missing secure crypto support. Close and reopen the app, then try again.'
    );
  }
  if (/user rejected|denied/i.test(lower)) {
    return new WalletSendError('Transaction failed');
  }
  if (message.length > 160) {
    return new WalletSendError(fallback);
  }
  return new WalletSendError(message || fallback);
}
