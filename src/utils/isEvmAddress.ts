/** Lightweight address checks — avoids heavy SDK imports on list screens. */

export function isEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function isTronAddress(value: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim());
}

export function isValidSendAddress(network: string, value: string): boolean {
  const trimmed = value.trim();
  if (network === 'TRC20') return isTronAddress(trimmed);
  if (network === 'ERC20' || network === 'BEP20') {
    return isEvmAddress(trimmed);
  }
  return false;
}
