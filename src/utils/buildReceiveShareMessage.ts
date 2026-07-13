import { formatMessage } from "../i18n";
import type { TranslationDict } from "../i18n/types";

type Params = {
    t: TranslationDict;
    network: string;
    address: string;
    amount?: number | null;
    assetSymbol: string;
    isUsdt: boolean;
};

export function buildReceiveShareMessage({
    t,
    network,
    address,
    amount,
    assetSymbol,
    isUsdt,
}: Params): string {
    const hasAmount = amount != null && amount > 0;

    const body = isUsdt
        ? hasAmount
            ? formatMessage(t.wallet.shareMessageWithAmount, { amount, network, address })
            : formatMessage(t.wallet.shareMessage, { network, address })
        : hasAmount
          ? formatMessage(t.wallet.shareMessageNativeWithAmount, {
                amount,
                symbol: assetSymbol,
                network,
                address,
            })
          : formatMessage(t.wallet.shareMessageNative, {
                symbol: assetSymbol,
                network,
                address,
            });

    return `${body}${t.wallet.shareScanHint}`;
}
