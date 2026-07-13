import { UsdtNetwork } from '../../constants/usdtNetworks';
import { isCandideConfigured, isCandideNetwork } from '../../config/candide';
import { estimateEvmUsdtFee, sendEvmUsdtWithCandide } from './candideEvmSendService';
import { sendTrc20Usdt } from './walletTrc20SendService';
import { WalletSendError } from './walletEvmProvider';

export { WalletSendError };

export async function estimateUsdtSendFee(params: {
  network: UsdtNetwork;
  toAddress: string;
  amount: number;
  pin?: string;
  fromAddress?: string;
}): Promise<{ feeUsdt: number; fromAddress: string }> {
  if (params.network === 'TRC20') {
    const { estimateTrc20UsdtFee } = await import('./walletTrc20SendService');
    return estimateTrc20UsdtFee(params);
  }
  if (isCandideNetwork(params.network) && isCandideConfigured()) {
    const fromAddress = params.fromAddress?.trim();
    if (!fromAddress && !params.pin) {
      throw new WalletSendError('Wallet PIN required');
    }
    return estimateEvmUsdtFee({
      network: params.network,
      toAddress: params.toAddress,
      amount: params.amount,
      pin: params.pin,
      fromAddress,
    });
  }
  throw new WalletSendError('USDT gas payment is not configured for this network');
}

export async function sendUsdt(params: {
  network: UsdtNetwork;
  toAddress: string;
  amount: number;
  pin: string;
  onProgress?: (step: 'signing' | 'broadcasting') => void;
}): Promise<{ txHash: string; fromAddress: string; feeUsdt?: number }> {
  const { network, toAddress, amount, pin, onProgress } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new WalletSendError('Invalid amount');
  }

  if (network === 'TRC20') {
    return sendTrc20Usdt({ network, toAddress, amount, pin, onProgress });
  }

  if (isCandideNetwork(network) && isCandideConfigured()) {
    return sendEvmUsdtWithCandide({ network, toAddress, amount, pin, onProgress });
  }

  throw new WalletSendError(
    'Send with USDT fees is not configured for this network. Add GasFree (TRC20) or Candide (EVM) API keys.'
  );
}
