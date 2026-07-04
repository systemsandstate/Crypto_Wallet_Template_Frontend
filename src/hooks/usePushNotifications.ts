import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAppSelector } from './useAppSelector';

import { RootState } from '../store/store';
import { navigationRef } from '../navigation/navigationRef';
import { addNotificationResponseListener, canUseRemotePush } from '../services/notificationsBridge';
import {
  parsePaymentNotificationData,
  syncPushTokenWithBackend,
  unregisterPushTokenFromBackend,
} from '../services/pushNotifications';

/**
 * Registers Expo push token when signed in and handles notification taps.
 */
export function usePushNotifications() {
  const merchant = useAppSelector((state: RootState) => state.auth.merchant);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !canUseRemotePush()) return;

    if (!merchant?.id) {
      registeredRef.current = false;
      return;
    }

    if (!registeredRef.current) {
      registeredRef.current = true;
      void syncPushTokenWithBackend();
    }
  }, [merchant?.id]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let removeListener: (() => void) | undefined;
    let cancelled = false;

    void addNotificationResponseListener((data) => {
      const parsed = parsePaymentNotificationData(data);
      if (!parsed?.paymentId || !navigationRef.isReady()) return;

      navigationRef.navigate('TransactionDetails', {
        paymentId: parsed.paymentId,
      });
    }).then((remove) => {
      if (cancelled) {
        remove();
        return;
      }
      removeListener = remove;
    });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);
}

export { unregisterPushTokenFromBackend };
