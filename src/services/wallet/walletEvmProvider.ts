import { JsonRpcProvider, Network, Wallet } from 'ethers';

import { UsdtNetwork } from '../../constants/usdtNetworks';
import {
  addressesToWalletPayload,
  decryptMnemonic,
  deriveAllAddresses,
  getPrivateKeyForNetwork,
} from './walletCore';
import { isWalletSetupLocally, loadEncryptedWallet } from './walletStorage';
import { persistAndSyncWalletAddresses } from './syncDeviceWallet';

const EVM_CHAIN_IDS: Partial<Record<UsdtNetwork, number>> = {
  ERC20: 1,
  BEP20: 56,
  POLYGON: 137,
};

/** Prefer reliable public endpoints; try fallbacks when one is rate-limited. */
const RPC_URLS: Partial<Record<UsdtNetwork, string[]>> = {
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
  POLYGON: [
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon-rpc.com',
    'https://1rpc.io/matic',
  ],
};

export class WalletSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletSendError';
  }
}

export const EVM_SEND_NETWORKS: UsdtNetwork[] = ['ERC20', 'BEP20', 'POLYGON'];

export function createEvmProvider(network: UsdtNetwork, rpcUrl: string): JsonRpcProvider {
  const chainId = EVM_CHAIN_IDS[network];
  const networkConfig = chainId ? Network.from(chainId) : undefined;
  return new JsonRpcProvider(rpcUrl, networkConfig, { staticNetwork: true });
}

export async function withWalletRpc<T>(
  network: UsdtNetwork,
  fn: (provider: JsonRpcProvider) => Promise<T>
): Promise<T> {
  const urls = RPC_URLS[network] || [];
  if (urls.length === 0) {
    throw new WalletSendError('Network RPC is not configured');
  }

  let lastError: unknown;
  for (const url of urls) {
    try {
      const provider = createEvmProvider(network, url);
      // Fail fast if this RPC is dead / rate-limited.
      await provider.getBlockNumber();
      return await fn(provider);
    } catch (err) {
      // Business errors (PIN, balance, address) must not rotate RPCs.
      if (err instanceof WalletSendError) throw err;
      lastError = err;
      const message = err instanceof Error ? err.message : String(err || '');
      // On-chain reverts / insufficient funds are not RPC problems.
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

  if (!(await isWalletSetupLocally())) {
    throw new WalletSendError('Wallet not set up on this device');
  }

  const encrypted = await loadEncryptedWallet();
  if (!encrypted) {
    throw new WalletSendError('Wallet not found on this device');
  }

  let mnemonic: string;
  try {
    mnemonic = await decryptMnemonic(encrypted, pin);
  } catch {
    throw new WalletSendError('Invalid wallet PIN');
  }

  // This device's wallet is source of truth for balance, history, and sends.
  const wallets = addressesToWalletPayload(deriveAllAddresses(mnemonic));
  try {
    await persistAndSyncWalletAddresses(wallets);
  } catch {
    // Continue signing even if sync fails; send still uses local keys.
  }

  const privateKey = getPrivateKeyForNetwork(mnemonic, network);
  return new Wallet(privateKey, provider);
}

export function mapSendError(err: unknown, fallback = 'Transaction failed'): WalletSendError {
  if (err instanceof WalletSendError) return err;
  const message = err instanceof Error ? err.message : String(err || fallback);
  if (/insufficient funds|gas required|gas fee/i.test(message)) {
    return new WalletSendError(
      'Not enough native coin for network fees (e.g. BNB on BEP20). Add a small amount and try again.'
    );
  }
  if (/exceeds balance|insufficient balance|transfer amount exceeds/i.test(message)) {
    return new WalletSendError('Insufficient USDT balance for this transfer');
  }
  if (/too many|rate|limit exceeded|detect network|failed to fetch|network error/i.test(message)) {
    return new WalletSendError('Network RPC is not configured');
  }
  if (/user rejected|denied/i.test(message)) {
    return new WalletSendError('Transaction failed');
  }
  // Keep short technical messages; long ethers dumps become generic.
  if (message.length > 160) {
    return new WalletSendError(fallback);
  }
  return new WalletSendError(message || fallback);
}
