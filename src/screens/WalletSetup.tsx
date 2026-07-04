import { View, Text, Alert, ScrollView, StyleSheet } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import {
    createMnemonic,
    isValidMnemonic,
    deriveAllAddresses,
    encryptMnemonic,
    addressesToWalletPayload,
} from "../services/wallet/walletCore";
import { saveEncryptedWallet } from "../services/wallet/walletStorage";
import { persistAndSyncWalletAddresses } from "../services/wallet/syncDeviceWallet";
import { navigateUp } from "../navigation/navigateUp";
import SetupStepHeader from "../components/SetupStepHeader";
import { USDT_NETWORKS } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { triggerDashboardRefresh } from "../utils/dashboardRefresh";

type Step = "choose" | "backup" | "import" | "pin" | "done";

const WalletSetup: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [step, setStep] = useState<Step>("choose");
    const [mnemonic, setMnemonic] = useState("");
    const [importPhrase, setImportPhrase] = useState("");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [confirmedBackup, setConfirmedBackup] = useState(false);
    const [isImportPath, setIsImportPath] = useState(false);
    const [loading, setLoading] = useState(false);
    const startAction = route.params?.startAction as "create" | "import" | undefined;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                title: {
                    ...FONTS.H2,
                    color: colors.mainDark,
                    marginBottom: 12,
                    textAlign: "center",
                },
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 14 * 1.6,
                    marginBottom: 20,
                    textAlign: "center",
                },
                phraseBox: {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                },
                phraseText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark,
                    lineHeight: 24,
                    textAlign: "center",
                },
                addressRow: {
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 8,
                },
                networkLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    marginBottom: 4,
                },
                addressText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                },
                wordGrid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 16,
                },
                wordChip: {
                    width: "47%",
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.white,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                },
                wordNum: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    width: 20,
                },
                wordText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                    flex: 1,
                },
                safetyTip: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 13 * 1.5,
                    textAlign: "center",
                    marginBottom: 16,
                },
            }),
        [colors, FONTS]
    );

    useEffect(() => {
        if (startAction === "create") {
            try {
                setMnemonic(createMnemonic());
                setStep("backup");
            } catch (err: any) {
                Alert.alert(t.common.error, err?.message || t.wallet.setupFailed);
                navigateUp(navigation, "WalletSetup");
            }
        } else if (startAction === "import") {
            setIsImportPath(true);
            setStep("import");
        }
    }, [startAction, navigation, t.common.error, t.wallet.setupFailed]);

    const handleCreate = () => {
        try {
            setIsImportPath(false);
            setMnemonic(createMnemonic());
            setStep("backup");
        } catch (err: any) {
            Alert.alert(t.common.error, err?.message || t.wallet.setupFailed);
        }
    };

    const handleImportNext = () => {
        const phrase = importPhrase.trim().toLowerCase();
        if (!isValidMnemonic(phrase)) {
            Alert.alert(t.common.error, t.wallet.invalidMnemonic);
            return;
        }
        setMnemonic(phrase);
        setStep("pin");
    };

    const finishSetup = async () => {
        if (pin.length < 4) {
            Alert.alert(t.common.error, t.wallet.pinTooShort);
            return;
        }
        if (pin !== confirmPin) {
            Alert.alert(t.common.error, t.wallet.pinMismatch);
            return;
        }

        setLoading(true);
        try {
            const encrypted = await encryptMnemonic(mnemonic, pin);
            await saveEncryptedWallet(encrypted);

            const addresses = deriveAllAddresses(mnemonic);
            const wallets = addressesToWalletPayload(addresses);
            await persistAndSyncWalletAddresses(wallets);
            triggerDashboardRefresh();

            setStep("done");
        } catch (err: any) {
            Alert.alert(t.common.error, err.message || t.wallet.setupFailed);
        } finally {
            setLoading(false);
        }
    };

    const renderChoose = () => (
        <components.MerchantContent style={{ paddingTop: 24 }}>
            <SetupStepHeader
                current={1}
                total={3}
                title={t.wallet.setupTitle}
                subtitle={t.wallet.setupDescription}
            />
            <components.Button
                title={t.wallet.createNewWallet}
                onPress={handleCreate}
                containerStyle={{ marginBottom: 12 }}
            />
            <components.Button
                title={t.wallet.importWallet}
                onPress={() => {
                    setIsImportPath(true);
                    setStep("import");
                }}
                containerStyle={{ marginBottom: 12 }}
            />
        </components.MerchantContent>
    );

    const renderBackup = () => {
        const words = mnemonic.trim().split(/\s+/).filter(Boolean);
        return (
        <components.MerchantContent style={{ paddingTop: 24 }}>
            <SetupStepHeader
                current={1}
                total={3}
                title={t.wallet.backupTitle}
                subtitle={t.wallet.backupDescription}
            />
            <View style={styles.wordGrid}>
                {words.map((word, index) => (
                    <View key={`${index}-${word}`} style={styles.wordChip}>
                        <Text style={styles.wordNum}>{index + 1}.</Text>
                        <Text style={styles.wordText}>{word}</Text>
                    </View>
                ))}
            </View>
            <Text style={styles.safetyTip}>{t.ux.backupSafetyTip}</Text>
            <components.Button
                title={confirmedBackup ? t.wallet.backupConfirmed : t.wallet.confirmBackup}
                onPress={() => {
                    setConfirmedBackup(true);
                    setStep("pin");
                }}
                containerStyle={{ marginBottom: 12 }}
            />
        </components.MerchantContent>
        );
    };

    const renderImport = () => (
        <components.MerchantContent style={{ paddingTop: 24 }}>
            <SetupStepHeader
                current={1}
                total={2}
                title={t.wallet.importTitle}
                subtitle={t.wallet.importDescription}
            />
            <components.InputField
                placeholder={t.wallet.mnemonicPlaceholder}
                value={importPhrase}
                onChangeText={setImportPhrase}
                containerStyle={{ marginBottom: 16 }}
            />
            <components.Button title={t.wallet.continueSetup} onPress={handleImportNext} />
        </components.MerchantContent>
    );

    const renderPin = () => (
        <components.MerchantContent style={{ paddingTop: 24 }}>
            <SetupStepHeader
                current={2}
                total={isImportPath ? 2 : 3}
                title={t.wallet.pinTitle}
                subtitle={t.wallet.pinDescription}
            />
            <components.InputField
                placeholder={t.wallet.pinPlaceholder}
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="numeric"
                containerStyle={{ marginBottom: 12 }}
            />
            <components.InputField
                placeholder={t.wallet.confirmPinPlaceholder}
                value={confirmPin}
                onChangeText={setConfirmPin}
                secureTextEntry
                keyboardType="numeric"
                containerStyle={{ marginBottom: 16 }}
            />
            {loading ? (
                <View style={{ alignItems: "center", marginVertical: 12 }}>
                    <components.LoadingSpinner size={40} />
                </View>
            ) : (
                <components.Button title={t.wallet.finishSetup} onPress={finishSetup} />
            )}
        </components.MerchantContent>
    );

    const renderDone = () => {
        const addresses = deriveAllAddresses(mnemonic);
        return (
            <components.MerchantContent style={{ paddingTop: 24 }}>
                <SetupStepHeader
                    current={isImportPath ? 2 : 3}
                    total={isImportPath ? 2 : 3}
                    title={t.wallet.setupComplete}
                    subtitle={t.wallet.setupCompleteDescription}
                />
                {USDT_NETWORKS.map((network) => (
                    <View key={network} style={styles.addressRow}>
                        <Text style={styles.networkLabel}>{getLocalizedNetworkLabel(network, t)}</Text>
                        <Text style={styles.addressText} selectable>
                            {addresses[network] || "—"}
                        </Text>
                    </View>
                ))}
                <components.Button
                    title={t.wallet.goToDashboard}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] })}
                    containerStyle={{ marginTop: 20 }}
                />
            </components.MerchantContent>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header
                    title={t.wallet.setupTitle}
                    goBack={step === "choose"}
                />
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
                    {step === "choose" && renderChoose()}
                    {step === "backup" && renderBackup()}
                    {step === "import" && renderImport()}
                    {step === "pin" && renderPin()}
                    {step === "done" && renderDone()}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default WalletSetup;
