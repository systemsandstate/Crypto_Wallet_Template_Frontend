import { Contract, getAddress, isAddress, parseUnits } from 'ethers';

import { UsdtNetwork } from '../../constants/usdtNetworks';
import { USDT_CONTRACTS } from './usdtContracts';
import {
  EVM_SEND_NETWORKS,
  WalletSendError,
  mapSendError,
  resolveTxFeeOverrides,
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
      const contract = new Contract(meta.contractAddress, ERC20_TRANSFER_ABI, provider);
      const [signer, feeOverrides] = await Promise.all([
        unlockWalletSigner(network, pin, provider),
        resolveTxFeeOverrides(provider),
      ]);
      const connected = contract.connect(signer) as Contract;

      onProgress?.('signing');
      const tx = await connected.transfer(checksumTo, amountRaw, {
        gasLimit: 120_000n,
        ...feeOverrides,
      });

      onProgress?.('broadcasting');
      const txHash = tx.hash;
      if (!txHash) {
        throw new WalletSendError('Transaction failed');
      }

      void tx.wait(1).catch(() => {});
      return { txHash, fromAddress: signer.address };
    });
  } catch (err) {
    throw mapSendError(err);
  }
}
