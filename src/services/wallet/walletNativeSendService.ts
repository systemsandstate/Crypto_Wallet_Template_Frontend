import { getAddress, isAddress, parseUnits } from 'ethers';

import { UsdtNetwork, NATIVE_SYMBOLS } from '../../constants/usdtNetworks';
import { api } from '../api';
import {
  EVM_SEND_NETWORKS,
  WalletSendError,
  mapSendError,
  toTokenAmountString,
  unlockWalletSigner,
  withWalletRpc,
} from './walletEvmProvider';

export { WalletSendError };

export async function sendNative(params: {
  network: UsdtNetwork;
  toAddress: string;
  amount: number;
  pin: string;
  onProgress?: (step: 'signing' | 'broadcasting') => void;
}): Promise<{ txHash: string; fromAddress: string; currency: string }> {
  const { network, toAddress, amount, pin, onProgress } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new WalletSendError('Invalid amount');
  }

  if (!EVM_SEND_NETWORKS.includes(network)) {
    throw new WalletSendError('Native send is only supported on BEP20, ERC20, and Polygon for now');
  }

  const destination = toAddress.trim();
  if (!isAddress(destination)) {
    throw new WalletSendError('Invalid wallet address for this network');
  }
  const checksumTo = getAddress(destination);
  const currency = NATIVE_SYMBOLS[network];
  const amountWei = parseUnits(toTokenAmountString(amount, 18), 18);

  try {
    const result = await withWalletRpc(network, async (provider) => {
      const signer = await unlockWalletSigner(network, pin, provider);

      onProgress?.('signing');
      const tx = await signer.sendTransaction({ to: checksumTo, value: amountWei });

      onProgress?.('broadcasting');
      const receipt = await tx.wait();
      const txHash = receipt?.hash ?? tx?.hash;
      if (!txHash) {
        throw new WalletSendError('Transaction failed');
      }

      return { txHash, fromAddress: signer.address, currency };
    });

    void api
      .reportWalletSend({
        network,
        txHash: result.txHash,
        fromAddress: result.fromAddress,
        toAddress: checksumTo,
        amount,
        currency,
      })
      .catch(() => {});

    return result;
  } catch (err) {
    throw mapSendError(err);
  }
}
