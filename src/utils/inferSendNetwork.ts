import type { UsdtNetwork } from '../constants/usdtNetworks';
import { DEFAULT_USDT_NETWORK } from '../constants/usdtNetworks';

/** Guess payment route from account number format (non-crypto users never pick a network). */
export const inferSendNetworkFromAddress = (address: string): UsdtNetwork | null => {
  const trimmed = address.trim();
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) return 'TRC20';
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
  return null;
};

/** Resolve USDT network from a pasted account number — no manual network pick. */
export const resolveNetworkFromAccountNumber = (address: string): UsdtNetwork | null => {
  const trimmed = address.trim();
  const inferred = inferSendNetworkFromAddress(trimmed);
  if (inferred) return inferred;
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return DEFAULT_USDT_NETWORK;
  return null;
};

export const pickDefaultEvmNetwork = (
  balances: Record<string, number | null | undefined>
): UsdtNetwork => {
  for (const network of ['BEP20', 'ERC20'] as UsdtNetwork[]) {
    const value = balances[network];
    if (value != null && value > 0) return network;
  }
  return 'BEP20';
};
