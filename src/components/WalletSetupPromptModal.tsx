import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from './Button';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme';

type Props = {
  visible: boolean;
  onCreateWallet: () => void;
  onImportWallet: () => void;
};

const WalletSetupPromptModal: React.FC<Props> = ({
  visible,
  onCreateWallet,
  onImportWallet,
}) => {
  const { t } = useTranslation();
  const { colors, FONTS } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(6, 38, 100, 0.45)',
        },
        backdropTouchable: {
          flex: 1,
        },
        sheet: {
          backgroundColor: colors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 12,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginBottom: 20,
        },
        title: {
          ...FONTS.H4,
          color: colors.mainDark,
          textAlign: 'center',
          marginBottom: 10,
        },
        subtitle: {
          ...FONTS.Mulish_400Regular,
          fontSize: 14,
          color: colors.bodyTextColor,
          lineHeight: 14 * 1.6,
          textAlign: 'center',
          marginBottom: 24,
        },
        button: {
          marginBottom: 12,
        },
        buttonSecondary: {
          marginBottom: 8,
        },
      }),
    [colors, FONTS]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} accessibilityRole="none" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t.wallet.setupModalTitle}</Text>
          <Text style={styles.subtitle}>{t.wallet.setupModalDescription}</Text>
          <Button
            title={t.wallet.createNewWallet}
            onPress={onCreateWallet}
            containerStyle={styles.button}
          />
          <Button
            title={t.wallet.restoreWallet}
            onPress={onImportWallet}
            containerStyle={styles.buttonSecondary}
          />
        </View>
      </View>
    </Modal>
  );
};

export default WalletSetupPromptModal;
