import { Contract, getAddress, isAddress, parseUnits } from 'ethers';

import { UsdtNetwork } from '../../constants/usdtNetworks';
import { USDT_CONTRACTS } from './usdtContracts';
import {
  EVM_SEND_NETWORKS,
  WalletSendError,
  mapSendError,
  toTokenAmountString,
  unlockWalletSigner,
  withWalletRpc,
} from './walletEvmProvider';

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

export { WalletSendError };

export async function sendUsdt(params: {
  network: UsdtNetwork;
  toAddress: string;
  amount: number;
  pin: string;
  onProgress?: (step: 'signing' | 'broadcasting') => void;
}): Promise<{ txHash: string; fromAddress: string }> {
  const { network, toAddress, amount, pin, onProgress } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new WalletSendError('Invalid amount');
  }

  if (!EVM_SEND_NETWORKS.includes(network)) {
    throw new WalletSendError('Send is only supported on BEP20, ERC20, and Polygon for now');
  }

  const destination = toAddress.trim();
  if (!isAddress(destination)) {
    throw new WalletSendError('Invalid wallet address for this network');
  }
  const checksumTo = getAddress(destination);
  const meta = USDT_CONTRACTS[network];
  const amountRaw = parseUnits(toTokenAmountString(amount, meta.decimals), meta.decimals);

  try {
    return await withWalletRpc(network, async (provider) => {
      const signer = await unlockWalletSigner(network, pin, provider);
      const contract = new Contract(meta.contractAddress, ERC20_TRANSFER_ABI, signer);

      onProgress?.('signing');
      const tx = await contract.transfer(checksumTo, amountRaw);

      onProgress?.('broadcasting');
      const receipt = await tx.wait();
      const txHash = receipt?.hash ?? tx?.hash;
      if (!txHash) {
        throw new WalletSendError('Transaction failed');
      }

      return { txHash, fromAddress: signer.address };
    });
  } catch (err) {
    throw mapSendError(err);
  }
}
