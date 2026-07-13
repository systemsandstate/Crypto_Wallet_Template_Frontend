import { parseUnits } from "ethers";

import { DEFAULT_USDT_NETWORK, NATIVE_SYMBOLS, ReceiveAsset, USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { buildMultiNetworkUsdtQrPayload } from "./multiNetworkQrPayload";

const formatQrAmount = (amount: number): string => {
    const normalized = Number(amount.toFixed(8));
    return Number.isFinite(normalized) ? String(normalized) : String(amount);
};

/** Compact USDT payment URI — no `?` so mobile scanners keep address + amount. */
export const buildUsdtPaymentUri = (network: UsdtNetwork, recipient: string, amount: number): string => {
    const scheme = network === "TRC20" ? "tron" : network === "BEP20" ? "bep20" : "erc20";
    return `${scheme}:${recipient},${formatQrAmount(amount)}`;
};

/** @deprecated Use buildUsdtPaymentUri */
export const buildEvmUsdtTransferUri = (
    network: "ERC20" | "BEP20",
    recipient: string,
    amount: number
): string => buildUsdtPaymentUri(network, recipient, amount);

/** Build a scannable QR payload for receive (USDT or native coin). */
export const buildWalletQrPayload = (
    network: UsdtNetwork,
    address: string,
    amount?: number | null,
    asset: ReceiveAsset = "USDT"
): string => {
    const hasAmount = amount != null && amount > 0;

    if (asset === "NATIVE") {
        switch (network) {
            case "TRC20":
                return hasAmount ? `tron:${address}?amount=${amount}` : address;
            case "ERC20":
            case "BEP20":
                return hasAmount
                    ? `ethereum:${address}?value=${parseUnits(amount.toString(), 18).toString()}`
                    : address;
            default:
                return address;
        }
    }

    if (hasAmount) {
        return buildUsdtPaymentUri(network, address, amount);
    }

    return address;
};

/** USDT receive QR with all configured network addresses when available. */
export const buildReceiveQrPayload = (input: {
    addresses: Partial<Record<UsdtNetwork, string>>;
    amount?: number | null;
    asset?: ReceiveAsset;
    network: UsdtNetwork;
    fallbackAddress: string;
    businessName?: string;
}): string => {
    const asset = input.asset ?? "USDT";
    if (asset !== "USDT") {
        return buildWalletQrPayload(input.network, input.fallbackAddress, input.amount, asset);
    }

    const configured = USDT_NETWORKS.filter((network) => Boolean(input.addresses[network]?.trim()));
    const addresses =
        configured.length > 0
            ? (Object.fromEntries(
                  configured.map((network) => [network, input.addresses[network]!.trim()])
              ) as Partial<Record<UsdtNetwork, string>>)
            : ({ [input.network]: input.fallbackAddress.trim() } as Partial<
                  Record<UsdtNetwork, string>
              >);

    return buildMultiNetworkUsdtQrPayload({
        addresses,
        amount: input.amount,
        businessName: input.businessName,
        defaultNetwork: input.network || DEFAULT_USDT_NETWORK,
    });
};

export const getReceiveAssetSymbol = (network: UsdtNetwork, asset: ReceiveAsset): string =>
    asset === "USDT" ? "USDT" : NATIVE_SYMBOLS[network];

export const splitAddressLines = (address: string | null | undefined): string[] => {
    const safe = address?.trim() ?? "";
    if (!safe) return [];
    if (safe.length <= 28) return [safe];
    const mid = Math.ceil(safe.length / 2);
    return [safe.slice(0, mid), safe.slice(mid)];
};
