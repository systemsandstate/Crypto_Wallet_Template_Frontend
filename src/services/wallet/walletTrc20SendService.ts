import { UsdtNetwork } from '../../constants/usdtNetworks';
import { isGasFreeConfigured } from '../../config/gasfree';
import {
  deriveAllAddresses,
  walletAddressesFromMnemonic,
  getPrivateKeyForNetwork,
  unlockMnemonicWithPin,
  WalletUnlockError,
} from './walletCore';
import {
  hydrateLocalWalletAddresses,
  saveWalletAddresses,
  ensureLocalWalletForUnlock,
  persistTrc20OwnerEoa,
} from './walletStorage';
import { syncWalletAddressesInBackground } from './syncDeviceWallet';
import { WalletSendError, mapSendError } from './walletEvmProvider';
import {
  quoteGasFreeTrc20UsdtFee,
  sendGasFreeTrc20Usdt,
  deriveGasFreeTronAddress,
} from './gasfreeTronClient';

export { WalletSendError };

const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export function isTronAddress(value: string): boolean {
  return TRON_ADDRESS.test(value.trim());
}

async function unlockTronPrivateKey(pin: string): Promise<{
  privateKeyHex: string;
  ownerEoaAddress: string;
  fromAddress: string;
}> {
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
    throw mapTrc20SendError(err);
  }

  const derived = deriveAllAddresses(mnemonic);
  const wallets = walletAddressesFromMnemonic(mnemonic);
  const existingAddresses = await hydrateLocalWalletAddresses();
  const existingTrc20 = existingAddresses?.find((row) => row.network === 'TRC20')?.address;
  const nextTrc20 = wallets.find((row) => row.network === 'TRC20')?.address;
  if (!existingAddresses?.length || existingTrc20 !== nextTrc20) {
    void saveWalletAddresses(wallets);
    void syncWalletAddressesInBackground(wallets);
  }

  const privateKeyHex = getPrivateKeyForNetwork(mnemonic, 'TRC20');
  const ownerEoaAddress = derived.TRC20;
  void persistTrc20OwnerEoa(ownerEoaAddress);
  const fromAddress = deriveGasFreeTronAddress(ownerEoaAddress);
  return { privateKeyHex, ownerEoaAddress, fromAddress };
}

export async function estimateTrc20UsdtFee(params: {
  toAddress: string;
  amount: number;
  pin?: string;
  fromAddress?: string;
}): Promise<{ feeUsdt: number; fromAddress: string }> {
  if (!isGasFreeConfigured()) {
    throw new WalletSendError(
      'TRC20 gas-in-USDT is not configured. Add EXPO_PUBLIC_GASFREE_API_KEY and EXPO_PUBLIC_GASFREE_API_SECRET.'
    );
  }
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new WalletSendError('Invalid amount');
  }
  if (!isTronAddress(params.toAddress)) {
    throw new WalletSendError('Invalid wallet address for this network');
  }

  let ownerEoaAddress = '';
  if (params.pin) {
    ownerEoaAddress = (await unlockTronPrivateKey(params.pin)).ownerEoaAddress;
  }

  try {
    const quote = await quoteGasFreeTrc20UsdtFee({
      ownerEoaAddress: ownerEoaAddress || undefined,
    });
    const fromAddress =
      quote.gasFreeAddress ||
      params.fromAddress?.trim() ||
      (ownerEoaAddress ? deriveGasFreeTronAddress(ownerEoaAddress) : '');
    return { feeUsdt: quote.feeUsdt, fromAddress };
  } catch (err) {
    throw mapTrc20SendError(err);
  }
}

export async function sendTrc20Usdt(params: {
  network: UsdtNetwork;
  toAddress: string;
  amount: number;
  pin: string;
  onProgress?: (step: 'signing' | 'broadcasting') => void;
}): Promise<{ txHash: string; fromAddress: string; feeUsdt: number }> {
  if (params.network !== 'TRC20') {
    throw new WalletSendError('Invalid network for TRC20 send');
  }
  if (!isGasFreeConfigured()) {
    throw new WalletSendError(
      'TRC20 gas-in-USDT is not configured. Add EXPO_PUBLIC_GASFREE_API_KEY and EXPO_PUBLIC_GASFREE_API_SECRET.'
    );
  }
  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new WalletSendError('Invalid amount');
  }
  if (!isTronAddress(params.toAddress)) {
    throw new WalletSendError('Invalid wallet address for this network');
  }

  try {
    const { privateKeyHex, ownerEoaAddress, fromAddress } = await unlockTronPrivateKey(params.pin);
    const result = await sendGasFreeTrc20Usdt({
      privateKeyHex,
      ownerEoaAddress,
      toAddress: params.toAddress.trim(),
      amountUsdt: params.amount,
      onProgress: params.onProgress,
    });
    return {
      txHash: result.txHash,
      fromAddress,
      feeUsdt: result.feeUsdt,
    };
  } catch (err) {
    throw mapTrc20SendError(err);
  }
}

function mapTrc20SendError(err: unknown): WalletSendError {
  if (err instanceof WalletSendError) return err;
  const message = err instanceof Error ? err.message : String(err || '');
  const lower = message.toLowerCase();

  if (/not configured|gasfree api/i.test(lower)) {
    return new WalletSendError(message);
  }
  if (/gasfree_unauthorized|invalid api key|401|403/i.test(lower)) {
    return new WalletSendError('GasFree service is unavailable. Check the API credentials.');
  }
  if (/gasfree_tx_failed|gasfree_tx_timeout/i.test(lower)) {
    return new WalletSendError('TRC20 send is still processing or failed. Check Tronscan.');
  }
  if (/invalid wallet pin|wallet not/i.test(lower)) {
    return mapSendError(err);
  }
  if (/insufficient|not_enough|balance/i.test(lower)) {
    return new WalletSendError(
      'Insufficient USDT balance for this transfer plus the network fee paid in USDT'
    );
  }
  if (/invalid address/i.test(lower)) {
    return new WalletSendError('Invalid wallet address for this network');
  }
  if (/failed to fetch|network|timeout|aborted/i.test(lower)) {
    return new WalletSendError('Network RPC is not configured');
  }
  return mapSendError(err, 'TRC20 send failed');
}
