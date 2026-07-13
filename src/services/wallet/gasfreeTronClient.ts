import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { SigningKey, getBytes } from 'ethers';
import { utils as TronWebUtils } from 'tronweb';

import {
  GASFREE_CHAIN_ID,
  GASFREE_VERIFYING_CONTRACT,
  gasFreeApiBaseUrl,
  gasFreeApiKey,
  gasFreeApiSecret,
  gasFreeServiceProviderOverride,
} from '../../config/gasfree';
import { USDT_CONTRACTS } from './usdtContracts';
import { deriveGasFreeTronAddress } from './gasfreeAddress';
import { api } from '../api';

export { deriveGasFreeTronAddress };

const PERMIT_712_TYPES = {
  PermitTransfer: [
    { name: 'token', type: 'address' },
    { name: 'serviceProvider', type: 'address' },
    { name: 'user', type: 'address' },
    { name: 'receiver', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'maxFee', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'version', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
};

const TOKEN_TRANSFER_DEADLINE_SEC = 300;
const TOKEN_TRANSFER_SIGNATURE_VERSION = 1;
const USDT_DECIMALS = USDT_CONTRACTS.TRC20.decimals;

type GasFreeApiEnvelope<T> = {
  code: number;
  reason?: string;
  message?: string;
  data: T;
};

type GasFreeAccountInfo = {
  accountAddress: string;
  gasFreeAddress: string;
  active: boolean;
  nonce: number;
  allowSubmit: boolean;
};

type GasFreeTokenConfig = {
  tokenAddress: string;
  activateFee: number;
  transferFee: number;
  decimal: number;
};

type GasFreeProviderConfig = {
  address: string;
  name?: string;
};

let cachedServiceProvider: string | null = null;

const GASFREE_ACCOUNT_CACHE_MS = 60_000;
const gasFreeAccountCache = new Map<string, { at: number; data: GasFreeAccountInfo }>();
const gasFreeAccountInFlight = new Map<string, Promise<GasFreeAccountInfo>>();

export function invalidateGasFreeAccountCache(): void {
  gasFreeAccountCache.clear();
}

export async function fetchGasFreeAccount(ownerEoaAddress: string): Promise<GasFreeAccountInfo> {
  const owner = ownerEoaAddress.trim();
  if (!owner) throw new Error('GASFREE_INVALID_ADDRESS');

  const cached = gasFreeAccountCache.get(owner);
  if (cached && Date.now() - cached.at < GASFREE_ACCOUNT_CACHE_MS) {
    return cached.data;
  }

  const inflight = gasFreeAccountInFlight.get(owner);
  if (inflight) return inflight;

  const promise = (async (): Promise<GasFreeAccountInfo> => {
    const data =
      Platform.OS === 'web'
        ? (await api.getGasFreeAccount(owner)).data
        : await gasFreeRequest<GasFreeAccountInfo>('GET', `/api/v1/address/${owner}`);
    gasFreeAccountCache.set(owner, { at: Date.now(), data });
    return data;
  })().finally(() => {
    gasFreeAccountInFlight.delete(owner);
  });

  gasFreeAccountInFlight.set(owner, promise);
  return promise;
}

function authHeaders(method: string, path: string): Record<string, string> {
  const apiKey = gasFreeApiKey();
  const apiSecret = gasFreeApiSecret();
  if (!apiKey || !apiSecret) {
    throw new Error('GasFree API credentials are not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${method}/tron${path}${timestamp}`;
  const signature = Buffer.from(hmac(sha256, utf8ToBytes(apiSecret), utf8ToBytes(message))).toString(
    'base64'
  );

  return {
    'Content-Type': 'application/json',
    Timestamp: `${timestamp}`,
    Authorization: `ApiKey ${apiKey}:${signature}`,
  };
}

async function gasFreeRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${gasFreeApiBaseUrl().replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    method,
    headers: authHeaders(method, path),
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json()) as GasFreeApiEnvelope<T>;
  if (!response.ok || payload.code !== 200) {
    const reason = payload.reason || payload.message || `HTTP ${response.status}`;
    throw new Error(`GASFREE_${reason}`);
  }
  return payload.data;
}

async function fetchUsdtTokenConfig(): Promise<GasFreeTokenConfig> {
  const tokens = await gasFreeRequest<{ tokens: GasFreeTokenConfig[] }>(
    'GET',
    '/api/v1/config/token/all'
  );
  const usdt = tokens.tokens.find(
    (row) => row.tokenAddress === USDT_CONTRACTS.TRC20.contractAddress
  );
  if (!usdt) {
    throw new Error('GASFREE_USDT_NOT_SUPPORTED');
  }
  return usdt;
}

async function resolveServiceProvider(): Promise<string> {
  const override = gasFreeServiceProviderOverride();
  if (override) return override;
  if (cachedServiceProvider) return cachedServiceProvider;

  const providers = await gasFreeRequest<{ providers: GasFreeProviderConfig[] }>(
    'GET',
    '/api/v1/config/provider/all'
  );
  const first = providers.providers?.[0]?.address;
  if (!first) {
    throw new Error('GASFREE_NO_PROVIDER');
  }
  cachedServiceProvider = first;
  return first;
}

function signPermitTransfer(
  privateKeyHex: string,
  domain: Record<string, string>,
  message: Record<string, string | number>
): string {
  const digest = TronWebUtils._TypedDataEncoder.hash(domain, PERMIT_712_TYPES, message).slice(2);
  const signingKey = new SigningKey(privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`);
  const sig = signingKey.sign(getBytes(`0x${digest}`));
  const r = sig.r.slice(2).padStart(64, '0');
  const s = sig.s.slice(2).padStart(64, '0');
  const v = Number(sig.v).toString(16).padStart(2, '0');
  return r + s + v;
}

function toSun(amountUsdt: number): string {
  const raw = Math.round(amountUsdt * 10 ** USDT_DECIMALS);
  if (!Number.isFinite(raw) || raw <= 0) throw new Error('Invalid amount');
  return String(raw);
}

export async function quoteGasFreeTrc20UsdtFee(params: {
  ownerEoaAddress?: string;
}): Promise<{ feeUsdt: number; gasFreeAddress: string; activationFeeUsdt: number }> {
  const token = await fetchUsdtTokenConfig();
  if (!params.ownerEoaAddress) {
    const feeSun = token.transferFee + token.activateFee;
    return {
      feeUsdt: feeSun / 10 ** USDT_DECIMALS,
      gasFreeAddress: '',
      activationFeeUsdt: token.activateFee / 10 ** USDT_DECIMALS,
    };
  }

  const account = await fetchGasFreeAccount(params.ownerEoaAddress);
  const activationFee = account.active ? 0 : token.activateFee;
  const feeSun = token.transferFee + activationFee;
  return {
    feeUsdt: feeSun / 10 ** USDT_DECIMALS,
    gasFreeAddress: account.gasFreeAddress || deriveGasFreeTronAddress(params.ownerEoaAddress),
    activationFeeUsdt: activationFee / 10 ** USDT_DECIMALS,
  };
}

export async function sendGasFreeTrc20Usdt(params: {
  privateKeyHex: string;
  ownerEoaAddress: string;
  toAddress: string;
  amountUsdt: number;
  onProgress?: (step: 'signing' | 'broadcasting') => void;
}): Promise<{ traceId: string; txHash: string; feeUsdt: number }> {
  const [account, token, serviceProvider] = await Promise.all([
    fetchGasFreeAccount(params.ownerEoaAddress),
    fetchUsdtTokenConfig(),
    resolveServiceProvider(),
  ]);

  const activationFee = account.active ? 0 : token.activateFee;
  const maxFeeSun = token.transferFee + activationFee;
  const timestamp = Math.floor(Date.now() / 1000);

  const domain = {
    name: 'GasFreeController',
    version: 'V1.0.0',
    chainId: `${GASFREE_CHAIN_ID}`,
    verifyingContract: GASFREE_VERIFYING_CONTRACT,
  };

  const message = {
    token: USDT_CONTRACTS.TRC20.contractAddress,
    serviceProvider,
    user: params.ownerEoaAddress,
    receiver: params.toAddress.trim(),
    value: toSun(params.amountUsdt),
    maxFee: String(maxFeeSun),
    deadline: timestamp + TOKEN_TRANSFER_DEADLINE_SEC,
    version: TOKEN_TRANSFER_SIGNATURE_VERSION,
    nonce: account.nonce,
  };

  params.onProgress?.('signing');
  const sig = signPermitTransfer(params.privateKeyHex, domain, message);

  params.onProgress?.('broadcasting');
  const submit = await gasFreeRequest<{
    id: string;
    estimatedTransferFee: number;
    estimatedActivateFee: number;
  }>('POST', '/api/v1/gasfree/submit', {
    ...message,
    sig,
  });

  const traceId = submit.id;
  const txHash = await pollGasFreeTrace(traceId);
  const feeSun = submit.estimatedTransferFee + (submit.estimatedActivateFee || 0);

  return {
    traceId,
    txHash,
    feeUsdt: feeSun / 10 ** USDT_DECIMALS,
  };
}

async function pollGasFreeTrace(traceId: string): Promise<string> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const status = await gasFreeRequest<{
      state?: string;
      txnHash?: string;
      reason?: string;
    }>('GET', `/api/v1/gasfree/${traceId}`);

    if (status.txnHash) return status.txnHash;
    if (status.state === 'FAILED' || status.state === 'REJECTED') {
      throw new Error(status.reason || 'GASFREE_TX_FAILED');
    }

    await new Promise((resolve) => setTimeout(resolve, 2_500));
  }
  throw new Error('GASFREE_TX_TIMEOUT');
}
