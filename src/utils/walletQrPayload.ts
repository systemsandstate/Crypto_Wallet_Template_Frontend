import { parseUnits } from "ethers";

import { NATIVE_SYMBOLS, ReceiveAsset, UsdtNetwork } from "../constants/usdtNetworks";

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
            case "POLYGON":
                return hasAmount
                    ? `ethereum:${address}?value=${parseUnits(amount.toString(), 18).toString()}`
                    : address;
            case "SOL":
            default:
                return address;
        }
    }

    switch (network) {
        case "TRC20":
            return hasAmount
                ? `tron:${address}?amount=${amount}&token=USDT`
                : address;
        case "ERC20":
            return hasAmount ? `ethereum:${address}?value=0` : address;
        case "BEP20":
        case "POLYGON":
        case "SOL":
        default:
            return address;
    }
};

export const getReceiveAssetSymbol = (network: UsdtNetwork, asset: ReceiveAsset): string =>
    asset === "USDT" ? "USDT" : NATIVE_SYMBOLS[network];

export const splitAddressLines = (address: string): string[] => {
    if (address.length <= 28) return [address];
    const mid = Math.ceil(address.length / 2);
    return [address.slice(0, mid), address.slice(mid)];
};
