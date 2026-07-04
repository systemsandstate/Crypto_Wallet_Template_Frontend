/** Extract a wallet address from common QR / URI payloads. */
export const parseScannedWalletAddress = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "";

    const withoutQuery = trimmed.split("?")[0];

    const tronMatch = withoutQuery.match(/^tron:([^/?#]+)/i);
    if (tronMatch?.[1]) return tronMatch[1];

    const uriMatch = withoutQuery.match(/^[a-z0-9+.-]+:([^/?#]+)/i);
    if (uriMatch?.[1] && uriMatch[1].length >= 20) return uriMatch[1];

    return withoutQuery;
};
