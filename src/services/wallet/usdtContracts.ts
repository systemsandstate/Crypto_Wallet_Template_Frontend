import { UsdtNetwork } from '../../constants/usdtNetworks';

/** USDT contract metadata (Trust Wallet assets reference). */
export const USDT_CONTRACTS: Record<
  UsdtNetwork,
  { contractAddress: string; decimals: number; chainLabel: string }
> = {
  TRC20: {
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    chainLabel: 'TRON',
  },
  ERC20: {
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    chainLabel: 'Ethereum',
  },
  BEP20: {
    contractAddress: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    chainLabel: 'BNB Chain',
  },
};
