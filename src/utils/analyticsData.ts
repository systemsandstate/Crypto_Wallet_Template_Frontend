import type { PaymentRequest, WalletTransfer } from "../services/api";

export type AnalyticsSegmentKey = "received" | "sent" | "pending";

export type AnalyticsSegment = {
    key: AnalyticsSegmentKey;
    value: number;
    color: string;
    label: string;
};

export type AnalyticsWeekDay = {
    key: string;
    label: string;
    received: number;
    sent: number;
    isToday?: boolean;
};

export type AnalyticsSnapshot = {
    walletBalance: number;
    receivedTotal: number;
    sentTotal: number;
    pendingTotal: number;
    activityTotal: number;
    segments: AnalyticsSegment[];
    week: AnalyticsWeekDay[];
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const dayKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const sumPayments = (items: PaymentRequest[]) =>
    items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);

export function buildAnalyticsSnapshot(
    payments: PaymentRequest[] | null | undefined,
    transfers: WalletTransfer[] | null | undefined,
    walletBalance: number,
    colors: { green: string; red: string; accentBlue: string },
    labels: { received: string; sent: string; pending: string },
    dateLocale: string
): AnalyticsSnapshot {
    const safePayments = payments ?? [];
    const safeTransfers = transfers ?? [];

    const receivedTotal = safeTransfers
        .filter((row) => row.type === "DEPOSIT" && row.currency === "USDT")
        .reduce((total, row) => total + (Number(row.amount) || 0), 0);

    const sentTotal = safeTransfers
        .filter((row) => row.type === "SEND" && row.currency === "USDT")
        .reduce((total, row) => total + (Number(row.amount) || 0), 0);

    const pendingItems = safePayments.filter((row) => row.status === "PENDING");
    const pendingTotal = sumPayments(pendingItems);

    const activityTotal = receivedTotal + sentTotal + pendingTotal;

    const segments: AnalyticsSegment[] = [
        { key: "received", value: receivedTotal, color: colors.green, label: labels.received },
        { key: "sent", value: sentTotal, color: colors.red, label: labels.sent },
        { key: "pending", value: pendingTotal, color: colors.accentBlue, label: labels.pending },
    ].filter((segment) => segment.value > 0);

    const today = startOfDay(new Date());
    const todayKey = dayKey(today);
    const weekBuckets = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        const key = dayKey(date);
        return {
            key,
            label: date.toLocaleDateString(dateLocale, { weekday: "short" }),
            received: 0,
            sent: 0,
            isToday: key === todayKey,
        };
    });
    const weekByKey = Object.fromEntries(weekBuckets.map((day) => [day.key, day]));

    for (const transfer of safeTransfers) {
        if (transfer.currency !== "USDT") continue;
        const bucket = weekByKey[dayKey(new Date(transfer.timestamp))];
        if (!bucket) continue;
        const amount = Number(transfer.amount) || 0;
        if (transfer.type === "DEPOSIT") bucket.received += amount;
        if (transfer.type === "SEND") bucket.sent += amount;
    }

    return {
        walletBalance,
        receivedTotal,
        sentTotal,
        pendingTotal,
        activityTotal,
        segments,
        week: weekBuckets,
    };
}

export function formatAnalyticsAmount(value: number, dateLocale: string) {
    const safe = Number.isFinite(value) ? value : 0;
    return safe.toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
