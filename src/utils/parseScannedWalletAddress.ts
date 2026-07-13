import { formatUnits } from "ethers";

import { ReceiveAsset, UsdtNetwork } from "../constants/usdtNetworks";
import { USDT_CONTRACTS } from "../services/wallet/usdtContracts";
import type { UsdtPayQrPayload } from "./multiNetworkQrPayload";
import {
    parseUsdtPayQrPayload,
    pickSendNetworkFromQrPayload,
    resolveAddressFromQrPayload,
} from "./multiNetworkQrPayload";

export type ScannedWalletPayload = {
    address: string;
    amount?: number;
    network?: UsdtNetwork;
    asset?: ReceiveAsset;
    recipientName?: string;
    qrPayload?: UsdtPayQrPayload;
};

const parsePositiveAmount = (raw: string | null): number | undefined => {
    if (!raw) return undefined;
    const value = parseFloat(raw.replace(",", "."));
    return Number.isFinite(value) && value > 0 ? value : undefined;
};

const resolveEvmUsdtNetwork = (contract: string, chainId?: number): UsdtNetwork | undefined => {
    const contractLower = contract.toLowerCase();
    for (const network of ["ERC20", "BEP20"] as const) {
        if (USDT_CONTRACTS[network].contractAddress.toLowerCase() === contractLower) {
            return network;
        }
    }
    if (chainId === 56) return "BEP20";
    if (chainId === 1) return "ERC20";
    return undefined;
};

/** EIP-681 USDT transfer — recipient is after `?`, kept for external wallet QRs. */
const parseEip681UsdtTransfer = (raw: string): ScannedWalletPayload | null => {
    const match = raw.match(/^ethereum:([^@/?#]+)(?:@(\d+))?\/transfer(?:\?(.*))?$/i);
    if (!match?.[1]) return null;

    const contract = match[1];
    const chainId = match[2] ? parseInt(match[2], 10) : undefined;
    const params = new URLSearchParams(match[3] ?? "");
    const recipient = params.get("address")?.trim();
    if (!recipient) return null;

    const network = resolveEvmUsdtNetwork(contract, chainId);
    const uint256 = params.get("uint256");
    let amount: number | undefined;
    if (uint256 && network) {
        try {
            const parsed = parseFloat(formatUnits(uint256, USDT_CONTRACTS[network].decimals));
            amount = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
        } catch {
            amount = undefined;
        }
    }

    return {
        address: recipient,
        amount,
        network: network ?? (chainId === 56 ? "BEP20" : "ERC20"),
        asset: "USDT",
    };
};

const parseSchemeUsdtPayment = (raw: string): ScannedWalletPayload | null => {
    const commaMatch = raw.match(/^(bep20|erc20|tron):([^,/?#]+),([0-9]+(?:[.,][0-9]+)?)$/i);
    if (commaMatch?.[1] && commaMatch[2] && commaMatch[3]) {
        const scheme = commaMatch[1].toLowerCase();
        const network: UsdtNetwork =
            scheme === "bep20" ? "BEP20" : scheme === "erc20" ? "ERC20" : "TRC20";
        return {
            address: commaMatch[2],
            amount: parsePositiveAmount(commaMatch[3]),
            network,
            asset: "USDT",
        };
    }

    const queryIndex = raw.indexOf("?");
    const base = queryIndex >= 0 ? raw.slice(0, queryIndex) : raw;
    const query = queryIndex >= 0 ? raw.slice(queryIndex + 1) : "";
    const params = new URLSearchParams(query);
    const schemeMatch = base.match(/^(bep20|erc20|tron):([^/?#]+)$/i);
    if (!schemeMatch?.[1] || !schemeMatch[2]) return null;

    const scheme = schemeMatch[1].toLowerCase();
    const address = schemeMatch[2];
    const amount = parsePositiveAmount(params.get("amount"));

    if (scheme === "tron") {
        const token = params.get("token")?.toUpperCase();
        const asset: ReceiveAsset = token === "USDT" ? "USDT" : amount != null ? "NATIVE" : "USDT";
        return {
            address,
            amount,
            network: "TRC20",
            asset,
        };
    }

    if (scheme === "bep20" || scheme === "erc20") {
        return {
            address,
            amount,
            network: scheme === "bep20" ? "BEP20" : "ERC20",
            asset: "USDT",
        };
    }

    return null;
};

/** Extract address, optional amount, and network hints from QR / URI payloads. */
export const parseScannedWalletPayload = (raw: string): ScannedWalletPayload | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const multiNetwork = parseUsdtPayQrPayload(trimmed);
    if (multiNetwork) {
        const network = pickSendNetworkFromQrPayload(multiNetwork);
        const address = resolveAddressFromQrPayload(multiNetwork, network);
        if (!address) return null;
        return {
            address,
            amount: multiNetwork.amount,
            network,
            asset: "USDT",
            recipientName: multiNetwork.businessName,
            qrPayload: multiNetwork,
        };
    }

    const eip681Usdt = parseEip681UsdtTransfer(trimmed);
    if (eip681Usdt) return eip681Usdt;

    const schemeUsdt = parseSchemeUsdtPayment(trimmed);
    if (schemeUsdt) return schemeUsdt;

    const queryIndex = trimmed.indexOf("?");
    const base = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
    const query = queryIndex >= 0 ? trimmed.slice(queryIndex + 1) : "";
    const params = new URLSearchParams(query);

    const ethereumMatch = base.match(/^ethereum:([^/?#]+)/i);
    if (ethereumMatch?.[1] && !base.includes("/transfer") && !ethereumMatch[1].includes("@")) {
        const address = ethereumMatch[1];
        const valueParam = params.get("value");
        let amount: number | undefined;
        let asset: ReceiveAsset = "USDT";
        if (valueParam && valueParam !== "0") {
            try {
                amount = parseFloat(formatUnits(valueParam, 18));
                asset = "NATIVE";
            } catch {
                amount = undefined;
            }
        }
        return {
            address,
            amount: amount && amount > 0 ? amount : undefined,
            asset,
            network: "ERC20",
        };
    }

    const uriMatch = base.match(/^[a-z0-9+.-]+:([^/?#]+)/i);
    if (uriMatch?.[1] && uriMatch[1].length >= 20 && !uriMatch[1].includes("@")) {
        return { address: uriMatch[1] };
    }

    const address = base.trim();
    return address ? { address } : null;
};

/** @deprecated Prefer parseScannedWalletPayload for send flows that need amount/network. */
export const parseScannedWalletAddress = (raw: string): string =>
    parseScannedWalletPayload(raw)?.address ?? "";
