import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AVATAR_KEY_PREFIX = "merchantAvatar:";
const MAX_BYTES = 5 * 1024 * 1024;

const avatarKey = (merchantId: string) => `${AVATAR_KEY_PREFIX}${merchantId}`;

export const getStoredAvatarUrl = (merchantId?: string | null): string | null => {
    if (!merchantId || Platform.OS !== "web" || typeof localStorage === "undefined") {
        return null;
    }
    return localStorage.getItem(avatarKey(merchantId));
};

export const getStoredAvatarUrlAsync = async (
    merchantId?: string | null
): Promise<string | null> => {
    if (!merchantId) return null;
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
        return localStorage.getItem(avatarKey(merchantId));
    }
    return AsyncStorage.getItem(avatarKey(merchantId));
};

export const setStoredAvatarUrl = (merchantId: string, avatarUrl: string | null) => {
    const key = avatarKey(merchantId);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
        if (avatarUrl) localStorage.setItem(key, avatarUrl);
        else localStorage.removeItem(key);
        return;
    }
    if (avatarUrl) void AsyncStorage.setItem(key, avatarUrl);
    else void AsyncStorage.removeItem(key);
};

export const readImageFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject(new Error("Please choose an image file"));
            return;
        }
        if (file.size > MAX_BYTES) {
            reject(new Error("Image must be less than 5MB"));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
    });

export const validateImageDataUrl = (dataUrl: string) => {
    if (!dataUrl.startsWith("data:image/")) {
        throw new Error("Please choose an image file");
    }
    // Rough base64 size check (~4/3 of raw bytes)
    const base64 = dataUrl.split(",")[1] || "";
    if (base64.length * 0.75 > MAX_BYTES) {
        throw new Error("Image must be less than 5MB");
    }
};
