import {
  CandidePaymaster,
  Simple7702Account,
  createAndSignEip7702DelegationAuthorization,
  createCallData,
  getFunctionSelector,
} from 'abstractionkit';
import { getAddress, parseUnits } from 'ethers';

import { UsdtNetwork } from '../../constants/usdtNetworks';
import { candideBundlerUrl, candideChainId, isCandideConfigured } from '../../config/candide';
import { USDT_CONTRACTS } from './usdtContracts';
import {
  EVM_SEND_NETWORKS,
  WalletSendError,
  getPublicEvmRpcUrl,
  mapSendError,
  resolveWalletRpcUrl,
  toTokenAmountString,
  unlockWalletSigner,
  withWalletRpc,
} from './walletEvmProvider';

const ERC20_TRANSFER_SELECTOR = getFunctionSelector('transfer(address,uint256)');

function encodeUsdtTransfer(to: string, amountRaw: bigint): string {
  return createCallData(ERC20_TRANSFER_SELECTOR, ['address', 'uint256'], [getAddress(to), amountRaw]);
}

async function quoteEvmUsdtFee(params: {
  network: UsdtNetwork;
  fromAddress: string;
  toAddress: string;
  amount: number;
}): Promise<{ feeUsdt: number; fromAddress: string }> {
  const meta = USDT_CONTRACTS[params.network];
  const amountRaw = parseUnits(toTokenAmountString(params.amount, meta.decimals), meta.decimals);
  const chainId = BigInt(candideChainId(params.network));
  const bundlerRpc = candideBundlerUrl(params.network);
  const nodeRpc =
    getPublicEvmRpcUrl(params.network) ?? (await resolveWalletRpcUrl(params.network));
  if (!nodeRpc) throw new WalletSendError('Network RPC is not configured');

  const account = new Simple7702Account(getAddress(params.fromAddress.trim()));
  const callData = encodeUsdtTransfer(params.toAddress.trim(), amountRaw);
  const delegated = await account.isDelegatedToThisAccount(nodeRpc);
  const userOp = await account.createUserOperation(
    [{ to: meta.contractAddress, value: 0n, data: callData }],
    nodeRpc,
    bundlerRpc,
    delegated ? undefined : { eip7702Auth: { chainId } }
  );

  const paymaster = new CandidePaymaster(bundlerRpc);
  const { tokenQuote } = await paymaster.createTokenPaymasterUserOperation(
    account,
    userOp,
    meta.contractAddress,
    bundlerRpc,
    undefined,
    { resetApproval: true }
  );

  const maxCost = tokenQuote?.tokenCost ?? 0n;
  return {
    feeUsdt: Number(maxCost) / 10 ** meta.decimals,
    fromAddress: params.fromAddress.trim(),
  };
}

export async function estimateEvmUsdtFee(params: {
  network: UsdtNetwork;
  toAddress: string;
  amount: number;
  pin?: string;
  fromAddress?: string;
}): Promise<{ feeUsdt: number; fromAddress: string }> {
  if (!isCandideConfigured()) {
    throw new WalletSendError(
      'EVM send with USDT fees is not configured. Add EXPO_PUBLIC_CANDIDE_API_KEY.'
    );
  }
  if (!EVM_SEND_NETWORKS.includes(params.network)) {
    throw new WalletSendError('Invalid network for Candide send');
  }

  try {
    const fromAddress = params.fromAddress?.trim();
    if (fromAddress) {
      return await quoteEvmUsdtFee({
        network: params.network,
        fromAddress,
        toAddress: params.toAddress,
        amount: params.amount,
      });
    }

    if (!params.pin) {
      throw new WalletSendError('Wallet PIN required');
    }

    return await withWalletRpc(params.network, async (provider) => {
      const signer = await unlockWalletSigner(params.network, params.pin!, provider);
      return quoteEvmUsdtFee({
        network: params.network,
        fromAddress: signer.address,
        toAddress: params.toAddress,
        amount: params.amount,
      });
    });
  } catch (err) {
    throw mapCandideError(err);
  }
}

export async function sendEvmUsdtWithCandide(params: {
  network: UsdtNetwork;
  toAddress: string;
  amount: number;
  pin: string;
  onProgress?: (step: 'signing' | 'broadcasting') => void;
}): Promise<{ txHash: string; fromAddress: string; feeUsdt: number }> {
  if (!isCandideConfigured()) {
    throw new WalletSendError(
      'EVM send with USDT fees is not configured. Add EXPO_PUBLIC_CANDIDE_API_KEY.'
    );
  }
  if (!EVM_SEND_NETWORKS.includes(params.network)) {
    throw new WalletSendError('Invalid network for Candide send');
  }

  const meta = USDT_CONTRACTS[params.network];
  const amountRaw = parseUnits(toTokenAmountString(params.amount, meta.decimals), meta.decimals);
  const chainId = BigInt(candideChainId(params.network));
  const bundlerRpc = candideBundlerUrl(params.network);

  try {
    return await withWalletRpc(params.network, async (provider) => {
      const signer = await unlockWalletSigner(params.network, params.pin, provider);
      const privateKey = signer.privateKey;
      const nodeRpc =
        getPublicEvmRpcUrl(params.network) ?? (await resolveWalletRpcUrl(params.network));
      if (!nodeRpc) throw new WalletSendError('Network RPC is not configured');
      const account = new Simple7702Account(signer.address);
      const callData = encodeUsdtTransfer(params.toAddress.trim(), amountRaw);
      const delegated = await account.isDelegatedToThisAccount(nodeRpc);

      params.onProgress?.('signing');
      let userOp = await account.createUserOperation(
        [{ to: meta.contractAddress, value: 0n, data: callData }],
        nodeRpc,
        bundlerRpc,
        delegated ? undefined : { eip7702Auth: { chainId } }
      );

      if (!delegated && userOp.eip7702Auth) {
        userOp.eip7702Auth = createAndSignEip7702DelegationAuthorization(
          BigInt(userOp.eip7702Auth.chainId),
          userOp.eip7702Auth.address ?? Simple7702Account.DEFAULT_DELEGATEE_ADDRESS,
          BigInt(userOp.eip7702Auth.nonce ?? 0),
          privateKey
        );
      }

      const paymaster = new CandidePaymaster(bundlerRpc);
      const { userOperation: sponsoredOp, tokenQuote } =
        await paymaster.createTokenPaymasterUserOperation(
          account,
          userOp,
          meta.contractAddress,
          bundlerRpc,
          undefined,
          { resetApproval: true }
        );

      sponsoredOp.signature = account.signUserOperation(sponsoredOp, privateKey, chainId);

      params.onProgress?.('broadcasting');
      const response = await account.sendUserOperation(sponsoredOp, bundlerRpc);
      const receipt = await response.included();
      const txHash = receipt?.receipt?.transactionHash;
      if (!txHash) {
        throw new WalletSendError('Transaction failed');
      }

      const feeUsdt =
        tokenQuote?.tokenCost != null
          ? Number(tokenQuote.tokenCost) / 10 ** meta.decimals
          : 0;

      return { txHash, fromAddress: signer.address, feeUsdt };
    });
  } catch (err) {
    throw mapCandideError(err);
  }
}

function mapCandideError(err: unknown): WalletSendError {
  if (err instanceof WalletSendError) return err;
  const message = err instanceof Error ? err.message : String(err || '');
  const lower = message.toLowerCase();

  if (/not configured|candide api/i.test(lower)) {
    return new WalletSendError(message);
  }
  if (/insufficient|exceeds balance|transfer amount exceeds/i.test(lower)) {
    return new WalletSendError(
      'Insufficient USDT balance for this transfer plus the network fee paid in USDT'
    );
  }
  if (/unsupported token|not supported by paymaster/i.test(lower)) {
    return new WalletSendError('USDT gas payment is not supported on this network yet.');
  }
  if (/unauthorized|invalid api key|401|403/i.test(lower)) {
    return new WalletSendError('Candide service is unavailable. Check the API key.');
  }
  if (/failed to fetch|network|timeout|aborted/i.test(lower)) {
    return new WalletSendError('Network RPC is not configured');
  }
  if (/eth_getcode|rpc call failed|node .* rpc/i.test(lower)) {
    return new WalletSendError('Network RPC is not configured');
  }
  return mapSendError(err, 'USDT send failed');
}
