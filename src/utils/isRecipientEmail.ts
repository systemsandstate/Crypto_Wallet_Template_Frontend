export const isRecipientEmail = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value.trim());
