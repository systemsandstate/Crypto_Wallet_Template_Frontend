import { UsdtNetwork } from '../constants/usdtNetworks';
import { isCandideConfigured, isCandideNetwork } from './candide';
import { isGasFreeConfigured } from './gasfree';

/** True when USDT can pay network fees on this network (GasFree TRC20 or Candide EVM). */
export function isUsdtGasConfigured(network: UsdtNetwork): boolean {
  if (network === 'TRC20') return isGasFreeConfigured();
  if (isCandideNetwork(network)) return isCandideConfigured();
  return false;
}

export function usesUsdtGas(network: UsdtNetwork): boolean {
  return network === 'TRC20' || isCandideNetwork(network);
}
