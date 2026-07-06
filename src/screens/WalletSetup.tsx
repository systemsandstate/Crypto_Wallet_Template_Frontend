import { View, Text,  ScrollView, StyleSheet, Platform } from "react-native";
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
    type DerivedWalletAddresses} from "../services/wallet/walletCore";
import { restoreLocalWalletFromSetup } from "../services/wallet/walletStorage";
import { syncWalletAddressesInBackground } from "../services/wallet/syncDeviceWallet";
import { navigateUp } from "../navigation/navigateUp";
import SetupStepHeader from "../components/SetupStepHeader";
import { USDT_NETWORKS } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { triggerDashboardRefresh } from "../utils/dashboardRefresh";
import { appAlert } from '../utils/appAlert';
import { triggerWalletSetupRefresh } from "../utils/walletSetupRefresh";
import { runWhenIdle } from "../utils/runWhenIdle";

type Step = "choose" | "backup" | "import" | "pin" | "done";

const WalletSetup: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const { colors, FONTS, isDark } = useTheme();
    const [step, setStep] = useState<Step>("choose");
    const [mnemonic, setMnemonic] = useState("");
    const [importPhrase, setImportPhrase] = useState("");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [confirmedBackup, setConfirmedBackup] = useState(false);
    const [isImportPath, setIsImportPath] = useState(false);
    const [loading, setLoading] = useState(false);
    const [derivedAddresses, setDerivedAddresses] = useState<DerivedWalletAddresses | null>(null);
    const startAction = route.params?.startAction as "create" | "import" | undefined;
    const isAddMode = Boolean(route.params?.addWallet);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                title: {
                    ...FONTS.H2,
                    color: colors.mainDark,
                    marginBottom: 12,
                    textAlign: "center"},
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 14 * 1.6,
                    marginBottom: 20,
                    textAlign: "center"},
                phraseBox: {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20},
                phraseText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark,
                    lineHeight: 24,
                    textAlign: "center"},
                addressRow: {
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 8},
                networkLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    marginBottom: 4},
                addressText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor},
                wordGrid: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 16},
                wordChip: {
                    width: "47%",
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.white,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 8,
                    paddingHorizontal: 10},
                wordNum: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    width: 20},
                wordText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                    flex: 1},
                safetyTip: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 13 * 1.5,
                    textAlign: "center",
                    marginBottom: 16},
                loadingOverlay: {
                    position: Platform.OS === "web" ? ("fixed" as "absolute") : "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(14, 14, 19, 0.55)" : "rgba(15, 23, 42, 0.28)",
                    zIndex: 1000,
                    elevation: 1000,
                    ...(Platform.OS === "web"
                        ? ({
                              inset: 0,
                              width: "100vw",
                              height: "100vh",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"} as object)
                        : {})}}),
        [colors, FONTS, isDark]
    );

    useEffect(() => {
        if (startAction === "create") {
            try {
                setMnemonic(createMnemonic());
                setStep("backup");
            } catch (err: any) {
                appAlert.alert(t.common.error, err?.message || t.wallet.setupFailed);
                navigateUp(navigation, "WalletSetup");
            }
        } else if (startAction === "import") {
            setIsImportPath(true);
            setStep("import");
        }
    }, [startAction, navigation, t.common.error, t.wallet.setupFailed]);

    useEffect(() => {
        if (step !== "pin" || !mnemonic) return;
        const task = runWhenIdle(() => {
            setDerivedAddresses(deriveAllAddresses(mnemonic));
        });
        return () => task.cancel();
    }, [step, mnemonic]);

    const handleCreate = () => {
        try {
            setIsImportPath(false);
            setMnemonic(createMnemonic());
            setStep("backup");
        } catch (err: any) {
            appAlert.alert(t.common.error, err?.message || t.wallet.setupFailed);
        }
    };

    const handleImportNext = () => {
        const phrase = importPhrase.trim().toLowerCase();
        if (!isValidMnemonic(phrase)) {
            appAlert.alert(t.common.error, t.wallet.invalidMnemonic);
            return;
        }
        setMnemonic(phrase);
        setStep("pin");
    };

    const finishSetup = async () => {
        if (pin.length < 4) {
            appAlert.alert(t.common.error, t.wallet.pinTooShort);
            return;
        }
        if (pin !== confirmPin) {
            appAlert.alert(t.common.error, t.wallet.pinMismatch);
            return;
        }

        setLoading(true);
        try {
            const encrypted = await encryptMnemonic(mnemonic, pin);
            const wallets = addressesToWalletPayload(
                derivedAddresses ?? deriveAllAddresses(mnemonic)
            );
            await restoreLocalWalletFromSetup({
                encryptedMnemonic: encrypted,
                addresses: wallets});
            void syncWalletAddressesInBackground(wallets);
            setStep("done");
            triggerWalletSetupRefresh();
            triggerDashboardRefresh();
        } catch (err: any) {
            appAlert.alert(t.common.error, err.message || t.wallet.setupFailed);
        } finally {
            setLoading(false);
        }
    };

    const finishAndLeave = () => {
        if (isAddMode) {
            const routeNames = navigation.getState()?.routeNames ?? [];
            if (routeNames.includes("Wallets")) {
                navigation.navigate("Wallets");
                return;
            }
            if (navigation.canGoBack()) {
                navigation.goBack();
                return;
            }
        }
        navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
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
                title={t.wallet.restoreWallet}
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
            <components.Button
                title={t.wallet.finishSetup}
                onPress={finishSetup}
                disabled={loading}
            />
        </components.MerchantContent>
    );

    const renderDone = () => {
        const addresses = derivedAddresses ?? deriveAllAddresses(mnemonic);
        return (
            <components.MerchantContent style={{ paddingTop: 24 }}>
                <SetupStepHeader
                    current={isImportPath ? 2 : 3}
                    total={isImportPath ? 2 : 3}
                    title={t.wallet.setupComplete}
                    subtitle={isImportPath ? t.wallet.setupRestoredDescription : t.wallet.setupCompleteDescription}
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
                    title={isAddMode ? t.wallet.doneAddWallet : t.wallet.goToDashboard}
                    onPress={finishAndLeave}
                    containerStyle={{ marginTop: 20 }}
                />
            </components.MerchantContent>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header
                    title={isAddMode ? t.wallet.addWallet : t.wallet.setupTitle}
                    goBack={step === "choose" || isAddMode}
                />
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
                    {step === "choose" && renderChoose()}
                    {step === "backup" && renderBackup()}
                    {step === "import" && renderImport()}
                    {step === "pin" && renderPin()}
                    {step === "done" && renderDone()}
                </ScrollView>
                {loading ? (
                    <View style={styles.loadingOverlay} pointerEvents="auto">
                        <components.LoadingSpinner size={48} />
                    </View>
                ) : null}
            </SafeAreaView>
        </View>
    );
};

export default WalletSetup;
