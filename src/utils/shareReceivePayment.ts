import { Linking, Platform, Share } from "react-native";
import * as FileSystem from "expo-file-system";

import { copyToClipboard } from "./copyToClipboard";

export type QrSvgRef = {
    toDataURL: (callback: (data: string) => void, options?: object) => void;
};

export type ShareReceiveOptions = {
    title: string;
    subject: string;
    message: string;
    qrValue: string;
    qrSvgRef?: QrSvgRef | null;
};

export type ShareReceiveResult = "shared" | "email" | "copied" | "cancelled";

function isShareCancelled(err: unknown): boolean {
    if (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError") {
        return true;
    }
    if (err instanceof Error && /cancel|abort|dismiss/i.test(err.message)) {
        return true;
    }
    return false;
}

async function createQrPngDataUrl(
    qrValue: string,
    qrSvgRef?: QrSvgRef | null
): Promise<string | null> {
    if (qrSvgRef?.toDataURL) {
        return new Promise((resolve) => {
            qrSvgRef.toDataURL(
                (data) => resolve(typeof data === "string" && data.length > 0 ? data : null),
                { width: 512, height: 512 }
            );
        });
    }

    if (Platform.OS === "web" && qrValue) {
        try {
            const QRCodeLib = await import("qrcode");
            return await QRCodeLib.toDataURL(qrValue, {
                width: 512,
                margin: 2,
                errorCorrectionLevel: "M",
            });
        } catch {
            return null;
        }
    }

    return null;
}

async function dataUrlToFileUri(dataUrl: string): Promise<string | null> {
    if (!FileSystem.cacheDirectory) return null;

    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const path = `${FileSystem.cacheDirectory}receive-qr-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return path;
}

function downloadDataUrlOnWeb(dataUrl: string, filename: string): void {
    if (typeof document === "undefined") return;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function openMailto(subject: string, body: string): Promise<boolean> {
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (Platform.OS === "web") {
        window.location.href = url;
        return true;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return false;
    await Linking.openURL(url);
    return true;
}

async function shareReceiveOnWeb(
    options: ShareReceiveOptions,
    pngDataUrl: string | null
): Promise<ShareReceiveResult> {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;

    if (nav?.share && pngDataUrl) {
        try {
            const blob = await (await fetch(pngDataUrl)).blob();
            const file = new File([blob], "payment-qr.png", { type: "image/png" });
            const payload = { title: options.title, text: options.message, files: [file] };

            if (!nav.canShare || nav.canShare(payload)) {
                await nav.share(payload);
                return "shared";
            }
        } catch (err) {
            if (isShareCancelled(err)) return "cancelled";
        }
    }

    if (nav?.share) {
        try {
            await nav.share({ title: options.title, text: options.message });
            if (pngDataUrl) downloadDataUrlOnWeb(pngDataUrl, "payment-qr.png");
            return "shared";
        } catch (err) {
            if (isShareCancelled(err)) return "cancelled";
        }
    }

    const opened = await openMailto(options.subject, options.message);
    if (pngDataUrl) downloadDataUrlOnWeb(pngDataUrl, "payment-qr.png");
    if (opened) return "email";

    const copied = await copyToClipboard(options.message);
    return copied ? "copied" : "email";
}

async function shareReceiveOnNative(
    options: ShareReceiveOptions,
    pngDataUrl: string | null
): Promise<ShareReceiveResult> {
    if (pngDataUrl) {
        const fileUri = await dataUrlToFileUri(pngDataUrl);
        if (fileUri) {
            try {
                let shareUrl = fileUri;
                if (Platform.OS === "android") {
                    shareUrl = await FileSystem.getContentUriAsync(fileUri);
                }

                await Share.share({
                    title: options.title,
                    message: options.message,
                    url: shareUrl,
                });
                return "shared";
            } catch (err) {
                if (isShareCancelled(err)) return "cancelled";
            }
        }
    }

    try {
        await Share.share({
            title: options.title,
            message: options.message,
        });
        return "shared";
    } catch (err) {
        if (isShareCancelled(err)) return "cancelled";
        throw err;
    }
}

export async function shareReceivePayment(
    options: ShareReceiveOptions
): Promise<ShareReceiveResult> {
    const pngDataUrl = await createQrPngDataUrl(options.qrValue, options.qrSvgRef);

    if (Platform.OS === "web") {
        return shareReceiveOnWeb(options, pngDataUrl);
    }

    return shareReceiveOnNative(options, pngDataUrl);
}
