import { UsdtNetwork, ReceiveAsset } from "../constants/usdtNetworks";
import { isUsdtGasConfigured, usesUsdtGas as networkUsesUsdtGas } from "../config/usdtGas";
import { isCandideNetwork } from "../config/candide";
import { isValidSendAddress, isTronAddress } from "./isEvmAddress";
import { isRecipientEmail } from "./isRecipientEmail";
import {
    defaultRoute,
    orderSendRouteCandidates,
    routesFromQrAddresses,
    type SendRouteCandidate,
} from "./pickFundedSendNetwork";
import type { UsdtPayQrPayload } from "./multiNetworkQrPayload";
import { api } from "../services/api";
import { loadAddressBook } from "../services/addressBookStorage";
import { findAddressBookEntry } from "./addressBookMatch";
import { resolveActiveWalletAddresses } from "../services/wallet/syncDeviceWallet";
import { estimateTrc20UsdtFee } from "../services/wallet/walletTrc20SendService";
import { estimateEvmUsdtFee } from "../services/wallet/candideEvmSendService";
import type { TranslationDict } from "../i18n";

export type RecipientPreview = {
    kind: "app" | "contact" | "external";
    name: string;
    isSelf?: boolean;
    avatarUrl?: string | null;
};

export type SendPlan = {
    inputLabel: string;
    sendAddress: string;
    network: UsdtNetwork;
    amount: number;
    preview: RecipientPreview | null;
    feeUsdt: number | null;
    availableBalance: number | null;
};

export type SendPlanErrorCode =
    | "invalid_amount"
    | "missing_recipient"
    | "invalid_address"
    | "email_not_found"
    | "self_transfer"
    | "unsupported_network"
    | "gas_not_configured"
    | "insufficient_balance"
    | "fee_estimate_failed";

export type SendPlanError = {
    code: SendPlanErrorCode;
    message: string;
};

type BuildSendPlanInput = {
    recipientInput: string;
    amount: number;
    preferredNetwork: UsdtNetwork;
    asset?: ReceiveAsset;
    merchantId?: string;
    networkBalances: Record<string, number | null | undefined>;
    nativeBalances: Record<string, number | null | undefined>;
    qrPayload?: UsdtPayQrPayload | null;
    lockNetwork?: boolean;
    labels: {
        invalidAmount: string;
        missingRecipient: string;
        invalidAddress: string;
        emailNotFound: string;
        cannotSendToSelf: string;
        networkUnsupported: string;
        gasNotConfigured: string;
        insufficientUsdt: string;
        insufficientUsdtWithFee: string;
        insufficientNative: string;
        insufficientAnyNetwork: string;
        feeEstimateFailed: string;
        recipientExternal: string;
    };
    t: TranslationDict;
};

const SUPPORTED_SEND_NETWORKS: UsdtNetwork[] = ["TRC20", "ERC20", "BEP20"];

async function lookupRecipientPreview(
    trimmed: string,
    currentNetwork: UsdtNetwork,
    merchantId: string | undefined,
    labels: BuildSendPlanInput["labels"],
    lookupNetwork?: UsdtNetwork
): Promise<{ preview: RecipientPreview | null; sendAddress: string; network?: UsdtNetwork }> {
    if (isRecipientEmail(trimmed)) {
        const lookupRes = await api.lookupWalletRecipient({
            email: trimmed,
            network: currentNetwork,
        });
        const data = lookupRes.data;
        if (data.found && data.isSelf) {
            return {
                preview: { kind: "app", name: labels.cannotSendToSelf, isSelf: true },
                sendAddress: trimmed,
            };
        }
        if (data.found && data.resolvedAddress) {
            const addressForNetwork =
                (data.addresses as Partial<Record<UsdtNetwork, string>>)?.[currentNetwork] ||
                data.resolvedAddress;
            const resolvedNetwork =
                (data.defaultNetwork as UsdtNetwork) ||
                (data.network as UsdtNetwork) ||
                currentNetwork;
            return {
                preview: {
                    kind: "app",
                    name: data.businessName || trimmed,
                    avatarUrl: data.avatarUrl ?? null,
                },
                sendAddress: addressForNetwork,
                network: currentNetwork,
            };
        }
        return {
            preview: { kind: "external", name: labels.emailNotFound },
            sendAddress: trimmed,
        };
    }

    const [lookupRes, bookEntries] = await Promise.all([
        api.lookupWalletRecipient({
            address: trimmed,
            network: lookupNetwork ?? currentNetwork,
        }),
        merchantId ? loadAddressBook(merchantId) : Promise.resolve([]),
    ]);
    const data = lookupRes.data;
    const contact = findAddressBookEntry(
        bookEntries,
        trimmed,
        (data.network as UsdtNetwork) || currentNetwork
    );

    if (data.found && data.isSelf) {
        return {
            preview: {
                kind: "app",
                name: contact?.name || labels.cannotSendToSelf,
                isSelf: true,
            },
            sendAddress: trimmed,
            network: (data.network as UsdtNetwork) || currentNetwork,
        };
    }

    if (data.found && data.businessName) {
        return {
            preview: { kind: "app", name: data.businessName, avatarUrl: data.avatarUrl ?? null },
            sendAddress: trimmed,
            network: (data.network as UsdtNetwork) || currentNetwork,
        };
    }

    if (contact?.name) {
        return {
            preview: { kind: "contact", name: contact.name },
            sendAddress: trimmed,
        };
    }

    return {
        preview: { kind: "external", name: labels.recipientExternal },
        sendAddress: trimmed,
    };
}

async function estimateFeeForRoute(
    network: UsdtNetwork,
    sendAddress: string,
    amount: number,
    isNative: boolean
): Promise<number | null> {
    if (isNative || !networkUsesUsdtGas(network)) return null;
    if (!isUsdtGasConfigured(network)) return null;

    const addresses = await resolveActiveWalletAddresses();

    if (network === "TRC20") {
        if (!isTronAddress(sendAddress)) return null;
        const fromAddress = addresses?.find((row) => row.network === "TRC20")?.address;
        const quote = await estimateTrc20UsdtFee({
            toAddress: sendAddress,
            amount,
            fromAddress,
        });
        return quote.feeUsdt;
    }

    if (isCandideNetwork(network)) {
        const fromAddress = addresses?.find((row) => row.network === network)?.address;
        if (!fromAddress) return null;
        const quote = await estimateEvmUsdtFee({
            network,
            toAddress: sendAddress,
            amount,
            fromAddress,
        });
        return quote.feeUsdt;
    }

    return null;
}

function buildRouteCandidates(
    input: BuildSendPlanInput,
    sendAddress: string,
    networkHint?: UsdtNetwork
): SendRouteCandidate[] {
    if (input.lockNetwork) {
        return [{ network: input.preferredNetwork, address: sendAddress }];
    }
    if (input.qrPayload?.addresses) {
        const preferred =
            input.qrPayload.defaultNetwork ??
            networkHint ??
            input.preferredNetwork;
        const preferredAddress = preferred
            ? input.qrPayload.addresses[preferred]?.trim()
            : "";
        if (preferred && preferredAddress) {
            return [{ network: preferred, address: preferredAddress }];
        }
        const qrRoutes = routesFromQrAddresses(input.qrPayload.addresses);
        if (qrRoutes.length > 0) return qrRoutes;
    }
    if (networkHint) {
        return defaultRoute(networkHint, sendAddress);
    }
    return defaultRoute(input.preferredNetwork, sendAddress);
}

export async function buildSendPlan(
    input: BuildSendPlanInput
): Promise<{ plan: SendPlan } | { error: SendPlanError }> {
    const trimmed = input.recipientInput.trim();
    const amount = input.amount;
    const isNative = (input.asset ?? "USDT") === "NATIVE";

    if (!amount || amount <= 0) {
        return { error: { code: "invalid_amount", message: input.labels.invalidAmount } };
    }
    if (!trimmed) {
        return { error: { code: "missing_recipient", message: input.labels.missingRecipient } };
    }

    let preview: RecipientPreview | null = null;
    let resolvedSendAddress = trimmed;
    let networkHint: UsdtNetwork | undefined =
        input.qrPayload?.defaultNetwork ?? input.preferredNetwork;

    try {
        const lookup = await lookupRecipientPreview(
            trimmed,
            input.preferredNetwork,
            input.merchantId,
            input.labels,
            networkHint
        );
        preview = lookup.preview;
        resolvedSendAddress = lookup.sendAddress;
        networkHint = lookup.network ?? networkHint;
    } catch {
        resolvedSendAddress = trimmed;
    }

    const qrBusinessName = input.qrPayload?.businessName?.trim();
    if (qrBusinessName) {
        preview = { kind: "app", name: qrBusinessName };
    }

    if (preview?.kind === "external" && isRecipientEmail(trimmed)) {
        return { error: { code: "email_not_found", message: input.labels.emailNotFound } };
    }
    if (preview?.isSelf) {
        return { error: { code: "self_transfer", message: input.labels.cannotSendToSelf } };
    }

    const routeCandidates = buildRouteCandidates(input, resolvedSendAddress, networkHint);
    const orderedRoutes = orderSendRouteCandidates(
        routeCandidates,
        isNative ? input.nativeBalances : input.networkBalances,
        amount,
        0
    );

    let lastInsufficientMessage = input.labels.insufficientAnyNetwork;

    for (const route of orderedRoutes) {
        const network = route.network;
        const sendAddress = route.address;

        if (!SUPPORTED_SEND_NETWORKS.includes(network)) {
            lastInsufficientMessage = input.labels.networkUnsupported;
            continue;
        }
        if (!isValidSendAddress(network, sendAddress)) {
            lastInsufficientMessage = input.t.ux.invalidWalletAddress;
            continue;
        }

        const usesGas = !isNative && networkUsesUsdtGas(network);
        if (usesGas && !isUsdtGasConfigured(network)) {
            return { error: { code: "gas_not_configured", message: input.labels.gasNotConfigured } };
        }

        const balance = isNative
            ? input.nativeBalances[network]
            : input.networkBalances[network];

        let feeUsdt: number | null = null;
        try {
            feeUsdt = await estimateFeeForRoute(network, sendAddress, amount, isNative);
        } catch {
            // Fee quotes are best-effort before review — never block Continue on RPC errors.
            feeUsdt = null;
        }

        const totalDebit = amount + (feeUsdt ?? 0);
        if (balance != null && totalDebit > balance) {
            lastInsufficientMessage =
                feeUsdt != null && feeUsdt > 0
                    ? input.labels.insufficientUsdtWithFee
                    : isNative
                      ? input.labels.insufficientNative
                      : input.labels.insufficientUsdt;
            continue;
        }

        if (balance == null) {
            lastInsufficientMessage = input.labels.insufficientAnyNetwork;
            continue;
        }

        return {
            plan: {
                inputLabel: trimmed,
                sendAddress,
                network,
                amount,
                preview,
                feeUsdt,
                availableBalance: balance,
            },
        };
    }

    return {
        error: {
            code: "insufficient_balance",
            message: lastInsufficientMessage,
        },
    };
}
