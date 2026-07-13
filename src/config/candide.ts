import { UsdtNetwork } from '../constants/usdtNetworks';

const trim = (value: string | undefined): string => (value ?? '').trim();

const CANDIDE_CHAIN_IDS: Partial<Record<UsdtNetwork, number>> = {
  ERC20: 1,
  BEP20: 56,
};

export const candideApiKey = (): string => trim(process.env.EXPO_PUBLIC_CANDIDE_API_KEY);

export function isCandideConfigured(): boolean {
  return Boolean(candideApiKey());
}

export function isCandideNetwork(network: UsdtNetwork): network is 'ERC20' | 'BEP20' {
  return network === 'ERC20' || network === 'BEP20';
}

export function candideChainId(network: UsdtNetwork): number {
  const chainId = CANDIDE_CHAIN_IDS[network];
  if (!chainId) throw new Error(`Candide is not supported on ${network}`);
  return chainId;
}

/** Candide bundler + paymaster RPC (same URL for both). */
export function candideBundlerUrl(network: UsdtNetwork): string {
  const apiKey = candideApiKey();
  if (!apiKey) throw new Error('Candide API key is not configured');
  const chainId = candideChainId(network);
  return `https://api.candide.dev/api/v3/${chainId}/${apiKey}`;
}
