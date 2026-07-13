import { View, Text, StyleSheet, Platform, Modal, Animated } from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import FormScrollView from "../components/FormScrollView";
import type { InputFieldHandle } from "../components/InputField";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import {
    createMnemonic,
    isValidMnemonic,
    deriveAllAddresses,
    encryptMnemonic,
    type DerivedWalletAddresses} from "../services/wallet/walletCore";
import { restoreLocalWalletFromSetup } from "../services/wallet/walletStorage";
import { syncWalletAddressesInBackground } from "../services/wallet/syncDeviceWallet";
import { resolveTrc20ReceiveForSetup } from "../services/wallet/trc20ReceiveAddress";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { navigateUp } from "../navigation/navigateUp";
import SetupStepHeader from "../components/SetupStepHeader";
import { USDT_NETWORKS } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { triggerDashboardRefresh } from "../utils/dashboardRefresh";
import { appAlert } from '../utils/appAlert';
import { blurActiveElement } from "../utils/blurActiveElement";
import { triggerWalletSetupRefresh } from "../utils/walletSetupRefresh";
import { yieldToUi } from "../utils/yieldToUi";
import { useSmoothSetupProgress } from "../hooks/useSmoothSetupProgress";

type Step = "choose" | "backup" | "import" | "pin" | "done";
type SetupPhase = "idle" | "preparing" | "verifying" | "encrypting" | "saving";

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
    const [setupPhase, setSetupPhase] = useState<SetupPhase>("idle");
    const setupProgress = useSmoothSetupProgress();
    const [derivedAddresses, setDerivedAddresses] = useState<DerivedWalletAddresses | null>(null);
    const [doneAddresses, setDoneAddresses] = useState<Record<string, string>>({});
    const [trc20ReceiveDisplay, setTrc20ReceiveDisplay] = useState("");
    const trc20OwnerRef = useRef("");
    const pinRef = useRef<InputFieldHandle>(null);
    const confirmPinRef = useRef<InputFieldHandle>(null);
    const startAction = route.params?.startAction as "create" | "import" | undefined;

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
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(14, 14, 19, 0.55)" : "rgba(15, 23, 42, 0.28)"},
                loadingCard: {
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 28,
                    paddingVertical: 24,
                    borderRadius: 16,
                    backgroundColor: colors.white,
                    maxWidth: 320,
                    width: "88%",
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 8px 32px rgba(15, 23, 42, 0.18)" } as object)
                        : {
                              shadowColor: "#0F172A",
                              shadowOffset: { width: 0, height: 8 },
                              shadowOpacity: 0.16,
                              shadowRadius: 16,
                              elevation: 8,
                          })},
                loadingText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginTop: 16,
                    lineHeight: 22},
                loadingHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginTop: 10,
                    lineHeight: 18},
                progressTrack: {
                    marginTop: 14,
                    width: "100%",
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceMuted,
                    overflow: "hidden"},
                progressFill: {
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: colors.accentBlue}}),
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
        setDerivedAddresses(deriveAllAddresses(mnemonic));
    }, [step, mnemonic]);

    const buildSetupWallets = (
        derived: DerivedWalletAddresses,
        trc20Receive: string
    ): Array<{ network: UsdtNetwork; address: string }> => [
        { network: "TRC20", address: trc20Receive },
        { network: "ERC20", address: derived.ERC20 },
        { network: "BEP20", address: derived.BEP20 },
    ];

    const setupStatusMessage = useMemo(() => {
        switch (setupPhase) {
            case "verifying":
                return t.wallet.setupImportVerifying;
            case "encrypting":
                return t.wallet.setupEncrypting;
            case "saving":
                return t.wallet.setupSaving;
            case "preparing":
            default:
                return t.wallet.setupFinishing;
        }
    }, [
        setupPhase,
        t.wallet.setupEncrypting,
        t.wallet.setupFinishing,
        t.wallet.setupImportVerifying,
        t.wallet.setupSaving,
    ]);

    const handleCreate = () => {
        try {
            setIsImportPath(false);
            setMnemonic(createMnemonic());
            setStep("backup");
        } catch (err: any) {
            appAlert.alert(t.common.error, err?.message || t.wallet.setupFailed);
        }
    };

    const handleImportNext = async () => {
        blurActiveElement();
        const phrase = importPhrase.trim().toLowerCase();
        if (!isValidMnemonic(phrase)) {
            appAlert.alert(t.common.error, t.wallet.invalidMnemonic);
            return;
        }

        setLoading(true);
        setSetupPhase("verifying");
        setupProgress.start({ durationMs: 12_000, cap: 0.92 });
        try {
            await yieldToUi();

            const derived = deriveAllAddresses(phrase);
            setupProgress.report(0.94);
            setDerivedAddresses(derived);
            setMnemonic(phrase);
            await setupProgress.finish();
            await new Promise((resolve) => setTimeout(resolve, 200));
            setStep("pin");
        } catch (err: any) {
            appAlert.alert(t.common.error, err?.message || t.wallet.setupFailed);
        } finally {
            setSetupPhase("idle");
            setupProgress.reset();
            setLoading(false);
        }
    };

    const finishSetup = async () => {
        blurActiveElement();
        pinRef.current?.blur();
        confirmPinRef.current?.blur();

        const pinValue = (pinRef.current?.getValue() ?? pin).trim();
        const confirmValue = (confirmPinRef.current?.getValue() ?? confirmPin).trim();

        if (pinValue.length < 4) {
            appAlert.alert(t.common.error, t.wallet.pinTooShort);
            return;
        }
        if (pinValue !== confirmValue) {
            appAlert.alert(t.common.error, t.wallet.pinMismatch);
            return;
        }
        if (!mnemonic.trim()) {
            appAlert.alert(t.common.error, t.wallet.invalidMnemonic);
            return;
        }

        setLoading(true);
        setSetupPhase("preparing");
        setupProgress.reset();
        try {
            await yieldToUi();

            const derived = derivedAddresses ?? deriveAllAddresses(mnemonic);
            setSetupPhase("encrypting");
            setupProgress.start({ durationMs: 10_000, cap: 0.88 });
            await yieldToUi();

            const encrypted = await encryptMnemonic(mnemonic, pinValue, (percent) => {
                setupProgress.report(0.12 + percent * 0.82);
            });
            const trc20Receive = await resolveTrc20ReceiveForSetup(derived.TRC20);
            if (trc20Receive === derived.TRC20) {
                throw new Error("Failed to resolve GasFree TRC20 receive address");
            }
            const wallets = buildSetupWallets(derived, trc20Receive);
            trc20OwnerRef.current = derived.TRC20;
            setTrc20ReceiveDisplay(trc20Receive);
            setDoneAddresses(Object.fromEntries(wallets.map((row) => [row.network, row.address])));

            setSetupPhase("saving");
            setupProgress.report(0.96);
            await yieldToUi();

            await restoreLocalWalletFromSetup({
                encryptedMnemonic: encrypted,
                addresses: wallets,
                trc20OwnerEoa: derived.TRC20,
            });
            void syncWalletAddressesInBackground(wallets);
            await setupProgress.finish();
            await new Promise((resolve) => setTimeout(resolve, 200));
            setStep("done");
            triggerWalletSetupRefresh();
            triggerDashboardRefresh();
        } catch (err: any) {
            appAlert.alert(t.common.error, err.message || t.wallet.setupFailed);
        } finally {
            setSetupPhase("idle");
            setupProgress.reset();
            setLoading(false);
        }
    };

    const finishAndLeave = () => {
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
            <components.Button
                title={t.wallet.continueSetup}
                onPress={() => void handleImportNext()}
                loading={loading}
                disabled={loading}
            />
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
                inputRef={pinRef}
                syncImmediately
                secureTextEntry
                keyboardType="numeric"
                containerStyle={{ marginBottom: 12 }}
            />
            <components.InputField
                placeholder={t.wallet.confirmPinPlaceholder}
                value={confirmPin}
                onChangeText={setConfirmPin}
                inputRef={confirmPinRef}
                syncImmediately
                secureTextEntry
                keyboardType="numeric"
                containerStyle={{ marginBottom: 16 }}
            />
            <components.Button
                title={t.wallet.finishSetup}
                onPress={() => void finishSetup()}
                loading={loading}
                disabled={loading}
            />
        </components.MerchantContent>
    );

    const renderDone = () => {
        const derived = derivedAddresses ?? deriveAllAddresses(mnemonic);
        const trc20Display = trc20ReceiveDisplay || doneAddresses.TRC20 || "—";
        const evmDisplay = doneAddresses.ERC20 || derived.ERC20 || "—";
        const bnbDisplay = doneAddresses.BEP20 || derived.BEP20 || "—";
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
                            {network === "TRC20"
                                ? trc20Display
                                : network === "ERC20"
                                  ? evmDisplay
                                  : bnbDisplay}
                        </Text>
                    </View>
                ))}
                <components.Button
                    title={t.wallet.goToDashboard}
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
                    title={t.wallet.setupTitle}
                    goBack={step === "choose"}
                />
                <FormScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
                    {step === "choose" && renderChoose()}
                    {step === "backup" && renderBackup()}
                    {step === "import" && renderImport()}
                    {step === "pin" && renderPin()}
                    {step === "done" && renderDone()}
                </FormScrollView>
                <Modal visible={loading} transparent animationType="fade" statusBarTranslucent>
                    <View style={styles.loadingOverlay} pointerEvents="auto">
                        <View style={styles.loadingCard}>
                            <components.LoadingSpinner size={48} />
                            <Text style={styles.loadingText}>{setupStatusMessage}</Text>
                            {setupPhase === "verifying" ? (
                                <Text style={styles.loadingHint}>{t.wallet.setupImportHint}</Text>
                            ) : null}
                            {setupPhase === "encrypting" ? (
                                <Text style={styles.loadingHint}>{t.wallet.setupEncryptingHint}</Text>
                            ) : null}
                            {setupPhase === "verifying" ||
                            setupPhase === "encrypting" ||
                            setupPhase === "saving" ? (
                                <View style={styles.progressTrack}>
                                    <Animated.View
                                        style={[styles.progressFill, { width: setupProgress.width }]}
                                    />
                                </View>
                            ) : null}
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

export default WalletSetup;
