import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from './useAppSelector';
import { useNavigation } from '@react-navigation/native';

import { RootState } from '../store/store';
import { needsWalletSetup } from '../services/wallet/walletSetupGate';
import { registerWalletSetupRefresh } from '../utils/walletSetupRefresh';

export function useWalletSetupPrompt() {
  const navigation = useNavigation();
  const merchant = useAppSelector((state: RootState) => state.auth.merchant);
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);

  const refresh = useCallback(
    async (opts?: { reopen?: boolean }) => {
      if (!merchant?.id) {
        dismissedRef.current = false;
        setVisible(false);
        return;
      }

      const required = await needsWalletSetup();
      if (!required) {
        dismissedRef.current = false;
        setVisible(false);
        return;
      }

      if (dismissedRef.current && !opts?.reopen) {
        setVisible(false);
        return;
      }

      dismissedRef.current = false;
      setVisible(true);
    },
    [merchant?.id]
  );

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setVisible(false);
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribeFocus = navigation.addListener('focus', () => {
      void refresh({ reopen: true });
    });
    const unregisterWalletRefresh = registerWalletSetupRefresh(() => {
      void refresh();
    });
    return () => {
      unsubscribeFocus();
      unregisterWalletRefresh();
    };
  }, [navigation, refresh]);

  return { visible, dismiss, refresh };
}
