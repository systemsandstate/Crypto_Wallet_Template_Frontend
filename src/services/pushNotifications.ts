import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { api } from './api';
import {
  canUseRemotePush,
  configureAndroidNotificationChannel,
  getExpoPushToken,
  isAndroidExpoGo,
  requestNotificationPermissions,
  scheduleLocalNotification,
} from './notificationsBridge';

const PUSH_TOKEN_STORAGE_KEY = 'expoPushToken';

export type PushSupportStatus =
  | { supported: true; reason?: undefined }
  | { supported: false; reason: string };

export const isExpoGo = (): boolean => isRunningInExpoGo();

export const getPushSupportStatus = (): PushSupportStatus => {
  if (Platform.OS === 'web') {
    return { supported: false, reason: 'Push is not available on web.' };
  }
  if (!Device.isDevice) {
    return { supported: false, reason: 'Use a physical device (not a simulator).' };
  }
  if (isAndroidExpoGo()) {
    return {
      supported: false,
      reason:
        'Remote push is not supported in Expo Go on Android (SDK 53+). Use the release APK or a development build.',
    };
  }
  const projectId = getExpoProjectId();
  if (!projectId) {
    return {
      supported: false,
      reason:
        'Set EAS project ID: run `npx eas login && npx eas init` in the frontend folder, or set EXPO_PUBLIC_EAS_PROJECT_ID in .env.',
    };
  }
  return { supported: true };
};

const getExpoProjectId = (): string | undefined => {
  const envProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const projectId =
    envProjectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;
  if (!projectId || projectId === 'REPLACE_WITH_EAS_PROJECT_ID') return undefined;
  return projectId;
};

export const getStoredPushToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!canUseRemotePush()) return null;

  const support = getPushSupportStatus();
  if (!support.supported) return null;

  if (Platform.OS === 'android') {
    await configureAndroidNotificationChannel();
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const projectId = getExpoProjectId()!;
  return getExpoPushToken(projectId);
};

/** Works in Expo Go on all platforms — useful when remote push is unavailable. */
export const sendLocalTestNotification = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await scheduleLocalNotification({
    title: 'Payment received',
    body: 'Test: 10.00 USDT on TRON',
    data: { type: 'payment_confirmed', paymentId: 'test-payment-id' },
  });
};

export const syncPushTokenWithBackend = async (): Promise<string | null> => {
  if (!canUseRemotePush()) return null;

  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return null;

    await api.registerPushToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
    });

    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    return token;
  } catch {
    return null;
  }
};

export const unregisterPushTokenFromBackend = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const token = await getStoredPushToken();
    if (!token) return;
    await api.removePushToken({ token });
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore logout cleanup errors
  }
};

export type PaymentNotificationData = {
  type?: string;
  paymentId?: string;
};

export const parsePaymentNotificationData = (
  data: Record<string, unknown> | undefined
): PaymentNotificationData | null => {
  if (!data || data.type !== 'payment_confirmed' || typeof data.paymentId !== 'string') {
    return null;
  }
  return { type: data.type, paymentId: data.paymentId };
};
