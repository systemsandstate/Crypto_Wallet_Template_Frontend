import type { PaymentRequest, WalletTransfer } from "../services/api";

/** Only completed (paid) payment requests belong in activity feeds — never pending. */
export const filterPaymentsForActivityFeed = (
    payments: PaymentRequest[],
    _deposits: WalletTransfer[] = []
): PaymentRequest[] => payments.filter((payment) => payment.status === "PAID");
