import { UsdtNetwork } from '../../constants/usdtNetworks';

/** Primary public RPC endpoints for client-side signing (read/send). */
export const WALLET_RPC_URLS: Partial<Record<UsdtNetwork, string>> = {
  ERC20: 'https://ethereum.publicnode.com',
  BEP20: 'https://bsc-dataseed.binance.org',
  POLYGON: 'https://polygon-bor-rpc.publicnode.com',
};
