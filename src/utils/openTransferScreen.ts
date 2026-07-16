import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { api } from "../services/api";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { resolveNetworkBalanceMap } from "../utils/walletBalance";
import { pickFundedNetworkLabel } from "../utils/pickFundedSendNetwork";
import type { SendPlan } from "../utils/buildSendPlan";
import type { RepeatSendPayload } from "../utils/repeatSendTransfer";

type TransferNavOptions = {
    returnScreen?: "Home" | "SendSelect" | "SendFundSelect";
    openScan?: boolean;
    /** Scan-first pay flow: no account-number form. */
    qrPay?: boolean;
    initialSendPlan?: SendPlan;
    openConfirm?: boolean;
    repeatSend?: RepeatSendPayload;
};

export async function openTransferScreen(
    navigation: { navigate: (screen: string, params?: object) => void },
    opts: TransferNavOptions = {}
): Promise<void> {
    let network: UsdtNetwork = "BEP20";
    try {
        const [activeAddresses, cached] = await Promise.all([
            prepareWalletContext(),
            api.getWalletBalances({ live: true }),
        ]);
        const balances = resolveNetworkBalanceMap(cached.data.balances ?? [], activeAddresses);
        network = pickFundedNetworkLabel(balances, [...USDT_NETWORKS], 0, 0) ?? "BEP20";
    } catch {
        // fall back to default network
    }

    const qrPay = opts.qrPay === true || opts.openScan === true;

    navigation.navigate("Withdraw", {
        network: opts.repeatSend?.network ?? network,
        returnScreen: opts.returnScreen ?? "Home",
        openScan: opts.openScan,
        qrPay,
        initialSendPlan: opts.initialSendPlan,
        openConfirm: opts.openConfirm,
        repeatSend: opts.repeatSend,
    });
}

export function openRepeatSendScreen(
    navigation: {
        navigate: (screen: string, params?: object) => void;
        getParent?: () => { navigate: (screen: string, params?: object) => void } | undefined;
        getState?: () => { routeNames?: string[] };
    },
    payload: RepeatSendPayload,
    returnScreen: "Home" | "SendSelect" | "SendFundSelect" = "Home"
): void {
    const params = {
        network: payload.network,
        returnScreen,
        repeatSend: payload,
    };

    const hasWithdraw = (navigation.getState?.().routeNames ?? []).includes("Withdraw");
    const parent = navigation.getParent?.();

    if (!hasWithdraw && parent) {
        parent.navigate("Dashboard", { screen: "Withdraw", params });
        return;
    }

    navigation.navigate("Withdraw", params);
}
