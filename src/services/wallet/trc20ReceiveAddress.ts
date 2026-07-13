import { isGasFreeConfigured } from '../../config/gasfree';
import { deriveGasFreeTronAddress, trc20AddressesMatchWallet } from './gasfreeAddress';
import { fetchGasFreeAccount } from './gasfreeTronClient';
import { repairTronBase58Address } from './tronAddressCodec';
import type { StoredWalletAddress } from './walletStorage';

/** User-facing TRC20 address (GasFree receive). Owner EOA stays device-only for signing. */
async function gasFreeReceiveForOwner(ownerEoa: string): Promise<string> {
  return resolveTrc20ReceiveForSetup(ownerEoa);
}

export async function resolveTrc20ReceiveAddressForWallet(
  storedTrc20: string,
  ownerEoa?: string | null
): Promise<{ receiveAddress: string; ownerEoa: string | null }> {
  const stored = storedTrc20.trim();
  if (!stored) {
    return { receiveAddress: '', ownerEoa: ownerEoa?.trim() || null };
  }

  const owner = ownerEoa?.trim();
  if (owner) {
    try {
      return { receiveAddress: await gasFreeReceiveForOwner(owner), ownerEoa: owner };
    } catch {
      return { receiveAddress: stored, ownerEoa: owner };
    }
  }

  if (isGasFreeConfigured()) {
    try {
      const info = await fetchGasFreeAccount(stored);
      const apiOwner = info.accountAddress?.trim();
      const apiReceive = info.gasFreeAddress?.trim();
      if (apiOwner === stored && apiReceive) {
        return { receiveAddress: apiReceive, ownerEoa: stored };
      }
    } catch {
      // stored may already be the GasFree receive address
    }
  }

  try {
    const derivedReceive = deriveGasFreeTronAddress(stored);
    if (derivedReceive !== stored) {
      return { receiveAddress: derivedReceive, ownerEoa: stored };
    }
  } catch {
    // ignore invalid TRON row
  }

  return { receiveAddress: stored, ownerEoa: null };
}

/** One TRC20 address for receive, send, balance, and server sync. */
export async function canonicalizeWalletAddresses(
  wallets: StoredWalletAddress[] | null | undefined,
  ownerEoa?: string | null
): Promise<StoredWalletAddress[]> {
  const rows = wallets ?? [];
  if (!rows.length) return [];
  const trcIdx = rows.findIndex((row) => row.network === 'TRC20');
  if (trcIdx < 0) return rows;

  const resolved = await resolveTrc20ReceiveAddressForWallet(
    rows[trcIdx].address,
    ownerEoa
  );
  const canonical = resolved.receiveAddress.trim();
  if (!canonical || canonical === rows[trcIdx].address.trim()) {
    return rows;
  }

  return rows.map((row, index) =>
    index === trcIdx ? { ...row, address: canonical } : row
  );
}

/** @deprecated Use canonicalizeWalletAddresses */
export const normalizeWalletRowsForDisplay = canonicalizeWalletAddresses;

export function trc20WalletAddressesMatch(
  a: string,
  b: string,
  ownerEoa?: string | null
): boolean {
  return trc20AddressesMatchWallet(a, b, ownerEoa);
}

/** Resolve GasFree receive address during wallet setup (API first, then local CREATE2). */
export async function resolveTrc20ReceiveForSetup(ownerEoa: string): Promise<string> {
  const owner = repairTronBase58Address(ownerEoa.trim());
  if (isGasFreeConfigured()) {
    try {
      const info = await fetchGasFreeAccount(owner);
      const fromApi = info.gasFreeAddress?.trim();
      if (fromApi && fromApi !== owner) return fromApi;
    } catch {
      // Web uses backend proxy; native calls GasFree directly.
    }
  }
  const receive = deriveGasFreeTronAddress(owner);
  if (receive === owner) {
    throw new Error('Failed to resolve GasFree TRC20 receive address');
  }
  return receive;
}

/** Sync display helper — always prefer GasFree receive over owner EOA. */
export function trc20UserFacingAddress(
  ownerEoa: string,
  _storedAddress?: string | null
): string {
  const owner = ownerEoa.trim();
  if (!owner) return _storedAddress?.trim() || '';
  return deriveGasFreeTronAddress(owner);
}
