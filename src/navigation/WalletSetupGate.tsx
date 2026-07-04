import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import WalletSetupPromptModal from '../components/WalletSetupPromptModal';
import { useWalletSetupPrompt } from '../hooks/useWalletSetupPrompt';
import type { MerchantTabParamList } from './TabNavigator';
import type { RootStackParamList } from './types';

type TabNav = CompositeNavigationProp<
  BottomTabNavigationProp<MerchantTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  children: React.ReactNode;
};

const WalletSetupGate: React.FC<Props> = ({ children }) => {
  const navigation = useNavigation<TabNav>();
  const { visible } = useWalletSetupPrompt();

  const openSetup = (startAction: 'create' | 'import') => {
    navigation.navigate('WalletSetup', { startAction });
  };

  return (
    <>
      {children}
      <WalletSetupPromptModal
        visible={visible}
        onCreateWallet={() => openSetup('create')}
        onImportWallet={() => openSetup('import')}
      />
    </>
  );
};

export default WalletSetupGate;
