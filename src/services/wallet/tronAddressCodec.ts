import bs58 from 'bs58';
import { getBytes, hexlify, sha256 } from 'ethers';

const tronBase58CheckEncode = (addressBytes: Uint8Array): string => {
  const checksum = getBytes(sha256(sha256(hexlify(addressBytes)))).slice(0, 4);
  const full = new Uint8Array(25);
  full.set(addressBytes);
  full.set(checksum, 21);
  return bs58.encode(full);
};

/** Re-encode TRON Base58Check when only the checksum suffix is wrong. */
export function repairTronBase58Address(address: string): string {
  const trimmed = address.trim();
  if (!trimmed.startsWith('T')) return trimmed;
  try {
    const decoded = bs58.decode(trimmed);
    if (decoded.length !== 25 || decoded[0] !== 0x41) return trimmed;
    return tronBase58CheckEncode(decoded.slice(0, 21));
  } catch {
    return trimmed;
  }
}

/** Validate TRON Base58Check (0x41 + 20-byte account id). */
export function isValidTronAddress(address: string): boolean {
  const trimmed = address.trim();
  if (!trimmed.startsWith('T')) return false;
  try {
    const decoded = bs58.decode(trimmed);
    if (decoded.length !== 25 || decoded[0] !== 0x41) return false;
    const payload = decoded.slice(0, 21);
    return tronBase58CheckEncode(payload) === trimmed;
  } catch {
    return false;
  }
}

/** TRON Base58 → 0x-prefixed 20-byte EVM hex (lowercase). */
export function tronBase58ToEthHex(tronAddress: string): string {
  const trimmed = tronAddress.trim();
  if (!isValidTronAddress(trimmed)) {
    throw new Error(`Invalid TRON address: ${trimmed}`);
  }
  const decoded = bs58.decode(trimmed);
  const body = hexlify(decoded.slice(1, 21)).slice(2);
  return `0x${body.padStart(40, '0').toLowerCase()}`;
}

/** 0x-prefixed 20-byte EVM hex → TRON Base58Check. */
export function ethHexToTronBase58(ethAddress: string): string {
  const body = ethAddress.replace(/^0x/i, '').slice(-40);
  if (body.length !== 40) {
    throw new Error(`Invalid EVM address: ${ethAddress}`);
  }
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(getBytes(`0x${body}`), 1);
  return tronBase58CheckEncode(addressBytes);
}
