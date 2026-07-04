import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';

/**
 * Importing the main `expo-notifications` entry loads push-token auto-registration,
 * which throws on Android Expo Go (SDK 53+). Use submodule imports instead.
 */
export const isAndroidExpoGo = (): boolean =>
  Platform.OS === 'android' && isRunningInExpoGo();

export const canUseRemotePush = (): boolean => !isAndroidExpoGo();

type NotificationsPermissions = typeof import('expo-notifications/build/NotificationPermissions');
type NotificationsHandler = typeof import('expo-notifications/build/NotificationsHandler');
type NotificationsEmitter = typeof import('expo-notifications/build/NotificationsEmitter');
type ScheduleNotification = typeof import('expo-notifications/build/scheduleNotificationAsync');
type NotificationChannels = typeof import('expo-notifications/build/setNotificationChannelAsync');
type ExpoPushToken = typeof import('expo-notifications/build/getExpoPushTokenAsync');

let permissionsMod: NotificationsPermissions | null = null;
let handlerMod: NotificationsHandler | null = null;
let emitterMod: NotificationsEmitter | null = null;
let scheduleMod: ScheduleNotification | null = null;
let channelMod: NotificationChannels | null = null;
let handlerConfigured = false;

const loadPermissions = async (): Promise<NotificationsPermissions> => {
  if (!permissionsMod) {
    permissionsMod = await import('expo-notifications/build/NotificationPermissions');
  }
  return permissionsMod;
};

const loadHandler = async (): Promise<NotificationsHandler> => {
  if (!handlerMod) {
    handlerMod = await import('expo-notifications/build/NotificationsHandler');
  }
  if (!handlerConfigured) {
    handlerMod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }
  return handlerMod;
};

export const ensureNotificationHandler = async (): Promise<void> => {
  await loadHandler();
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const Notifications = await loadPermissions();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleLocalNotification = async (content: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> => {
  await loadHandler();
  if (!scheduleMod) {
    scheduleMod = await import('expo-notifications/build/scheduleNotificationAsync');
  }
  await scheduleMod.scheduleNotificationAsync({
    content: { ...content, sound: 'default' },
    trigger: null,
  });
};

export const configureAndroidNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  if (!channelMod) {
    channelMod = await import('expo-notifications/build/setNotificationChannelAsync');
  }
  const { AndroidImportance } = await import('expo-notifications/build/NotificationChannelManager.types');
  await channelMod.setNotificationChannelAsync('payments', {
    name: 'Payments',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
};

export const getExpoPushToken = async (projectId: string): Promise<string> => {
  if (!canUseRemotePush()) {
    throw new Error('Remote push is unavailable in Expo Go on Android.');
  }
  const mod: ExpoPushToken = await import('expo-notifications/build/getExpoPushTokenAsync');
  const tokenResponse = await mod.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
};

export const addNotificationResponseListener = async (
  listener: (data: Record<string, unknown> | undefined) => void
): Promise<() => void> => {
  if (!emitterMod) {
    emitterMod = await import('expo-notifications/build/NotificationsEmitter');
  }
  const subscription = emitterMod.addNotificationResponseReceivedListener((response) => {
    listener(response.notification.request.content.data as Record<string, unknown>);
  });
  return () => subscription.remove();
};
