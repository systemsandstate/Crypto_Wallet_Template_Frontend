import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import type { WalletTransfer } from "../services/api";

export type RepeatSendPayload = {
    toAddress: string;
    network: UsdtNetwork;
    amount: number;
};

export function toRepeatSendPayload(transfer: WalletTransfer): RepeatSendPayload | null {
    if (transfer.type !== "SEND" || transfer.currency !== "USDT") return null;

    const toAddress = transfer.toAddress?.trim();
    const amount = Number(transfer.amount);
    if (!toAddress || !Number.isFinite(amount) || amount <= 0) return null;

    const network = transfer.network as UsdtNetwork;
    if (!(USDT_NETWORKS as readonly string[]).includes(network)) return null;

    return { toAddress, network, amount };
}
