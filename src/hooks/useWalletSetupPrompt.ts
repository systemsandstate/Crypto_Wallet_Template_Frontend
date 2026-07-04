import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from './useAppSelector';
import { useNavigation } from '@react-navigation/native';

import { RootState } from '../store/store';
import { needsWalletSetup } from '../services/wallet/walletSetupGate';

export function useWalletSetupPrompt() {
  const navigation = useNavigation();
  const merchant = useAppSelector((state: RootState) => state.auth.merchant);
  const [visible, setVisible] = useState(false);

  const refresh = useCallback(async () => {
    if (!merchant?.id) {
      setVisible(false);
      return;
    }
    const required = await needsWalletSetup();
    setVisible(required);
  }, [merchant?.id]);

  useEffect(() => {
    void refresh();
    const unsubscribe = navigation.addListener('focus', () => {
      void refresh();
    });
    return unsubscribe;
  }, [navigation, refresh]);

  return { visible, refresh };
}
