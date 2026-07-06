/** Lightweight EVM address check — avoids importing full ethers on list screens. */
export function isEvmAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}
