import type { TranslationDict } from "../i18n";

/** Turn technical wallet/blockchain errors into everyday language. */
export function toPlainLanguageError(message: string, t: TranslationDict): string {
    const lower = message.toLowerCase();

    if (/session expired/i.test(lower)) return t.common.sessionExpiredMessage;
    if (/does not hold your funds|restore your recovery phrase/i.test(lower)) return message;
    if (/invalid amount/i.test(lower)) return t.payment.invalidAmount;
    if (/wallet not set up|wallet not found/i.test(lower)) return t.wallet.walletLocalUnlockMessage;
    if (/invalid wallet pin|invalid pin/i.test(lower)) return t.ux.wrongWalletPin;
    if (/invalid wallet address|invalid address/i.test(lower)) return t.ux.invalidWalletAddress;
    if (/insufficient funds|not enough native|gas/i.test(lower)) return t.ux.insufficientGas;
    if (/exceeds balance|insufficient balance|transfer amount exceeds|insufficient usdt/i.test(lower)) {
        return t.ux.insufficientUsdt;
    }
    if (/network rpc|not configured|too many|rate limit|detect network|failed to fetch|network request failed|network request timed out|eth_getcode|rpc call failed|node .* rpc/i.test(lower)) {
        return t.ux.networkUnavailable;
    }
    if (/missing secure crypto|getrandomvalues|textencoder|textdecoder|buffer is not defined|property ['\"]buffer['\"]/i.test(lower)) {
        return t.ux.somethingWentWrong;
    }
    if (/does not match your registered/i.test(lower)) return t.ux.walletMismatch;
    if (/only supported on|not supported/i.test(lower)) return t.withdraw.networkSendUnsupported;
    if (/transaction failed|revert|execution reverted/i.test(lower)) return t.ux.transferFailed;
    if (/user rejected|denied/i.test(lower)) return t.ux.transferCancelled;
    if (/nonce|replacement underpriced/i.test(lower)) return t.ux.transferFailed;

    return message.length > 120 ? t.ux.somethingWentWrong : message;
}
