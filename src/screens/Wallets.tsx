import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Platform, 
    Pressable} from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { components } from "../components";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import {
    listLocalWallets,
    renameLocalWallet,
    removeLocalWallet,
    type LocalWalletSummary} from "../services/wallet/walletStorage";
import { activateLocalWallet } from "../services/wallet/syncDeviceWallet";
import { confirmAction } from "../utils/confirm";
import { appAlert } from '../utils/appAlert';
import { svg } from "../svg";

const Wallets: React.FC = ({ navigation }: any) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [wallets, setWallets] = useState<LocalWalletSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [renameTarget, setRenameTarget] = useState<LocalWalletSummary | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [menuTarget, setMenuTarget] = useState<LocalWalletSummary | null>(null);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                body: {
                    flex: 1,
                    paddingHorizontal: 20,
                    paddingTop: 8},
                sectionLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    marginBottom: 12,
                    marginTop: 8},
                listCard: {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 16,
                    overflow: "hidden"},
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    gap: 12},
                rowDivider: {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border},
                iconWrap: {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center"},
                activeBadge: {
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: colors.accentBlue,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: colors.surfaceMuted},
                activeCheck: {
                    color: colors.white,
                    fontSize: 10,
                    fontWeight: "700",
                    lineHeight: 12},
                name: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark,
                    flex: 1},
                menuBtn: {
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center"},
                footer: {
                    paddingHorizontal: 20,
                    paddingBottom: Platform.OS === "web" ? 24 : 12,
                    gap: 12},
                actionBtn: {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: "center",
                    justifyContent: "center"},
                actionBtnText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark},
                emptyWrap: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24},
                emptyTitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 20},
                emptyLink: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.accentBlue,
                    textDecorationLine: "underline"},
                modalBackdrop: {
                    flex: 1,
                    backgroundColor: colors.overlay,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24},
                modalCard: {
                    width: "100%",
                    maxWidth: 400,
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    padding: 20},
                menuCard: {
                    width: "100%",
                    maxWidth: 340,
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    overflow: "hidden"},
                menuTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 18,
                    color: colors.mainDark,
                    paddingHorizontal: 20,
                    paddingTop: 20,
                    paddingBottom: 12},
                menuOption: {
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border},
                menuOptionText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.accentBlue},
                menuOptionDestructive: {
                    color: colors.linkColor},
                menuOptionCancel: {
                    color: colors.bodyTextColor},
                modalTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 18,
                    color: colors.mainDark,
                    marginBottom: 12},
                modalInput: {
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.mainDark,
                    marginBottom: 16},
                modalActions: {
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 12},
                modalBtn: {
                    paddingVertical: 10,
                    paddingHorizontal: 14},
                modalBtnText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.bodyTextColor},
                modalBtnPrimaryText: {
                    color: colors.accentBlue}}),
        [FONTS, colors]
    );

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setWallets(await listLocalWallets());
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load])
    );

    const openAddWallet = () => {
        navigation.navigate("WalletSetup", { addWallet: true });
    };

    const goToHomepage = useCallback(() => {
        const routeNames = navigation.getState()?.routeNames ?? [];
        if (routeNames.includes("TabNavigator")) {
            navigation.navigate("TabNavigator", { screen: "Dashboard" });
            return;
        }
        const parent = navigation.getParent();
        if (parent) {
            parent.navigate("Dashboard");
            return;
        }
        navigation.navigate("TabNavigator", { screen: "Dashboard" });
    }, [navigation]);

    const handleSelectWallet = async (wallet: LocalWalletSummary) => {
        if (busyId) return;
        setBusyId(wallet.id);
        try {
            if (!wallet.isActive) {
                await activateLocalWallet(wallet.id);
            }
            goToHomepage();
        } finally {
            setBusyId(null);
        }
    };

    const openWalletAddresses = async (wallet: LocalWalletSummary) => {
        if (busyId) return;
        setBusyId(wallet.id);
        try {
            if (!wallet.isActive) {
                await activateLocalWallet(wallet.id);
                await load();
            }
            navigation.navigate("MyWallet");
        } finally {
            setBusyId(null);
        }
    };

    const openRename = (wallet: LocalWalletSummary) => {
        setRenameTarget(wallet);
        setRenameValue(wallet.name);
    };

    const submitRename = async () => {
        if (!renameTarget) return;
        const ok = await renameLocalWallet(renameTarget.id, renameValue);
        if (!ok) {
            appAlert.alert(t.common.error, t.wallet.renameWalletFailed);
            return;
        }
        setRenameTarget(null);
        await load();
    };

    const handleDelete = (wallet: LocalWalletSummary) => {
        confirmAction({
            title: t.wallet.deleteWalletTitle,
            message: t.wallet.deleteWalletMessage,
            confirmLabel: t.common.delete,
            cancelLabel: t.common.cancel,
            destructive: true,
            onConfirm: () => {
                void (async () => {
                    const wasActive = wallet.isActive;
                    const ok = await removeLocalWallet(wallet.id);
                    if (!ok) return;
                    if (wasActive) {
                        const remaining = await listLocalWallets();
                        const next = remaining.find((w) => w.isActive);
                        if (next) {
                            await activateLocalWallet(next.id);
                        }
                    }
                    await load();
                })();
            }});
    };

    const closeWalletMenu = () => setMenuTarget(null);

    const openWalletMenu = (wallet: LocalWalletSummary) => {
        setMenuTarget(wallet);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header title={t.wallet.walletsTitle} goBack={true} />
                {loading ? (
                    <View style={styles.emptyWrap}>
                        <LoadingSpinner size={48} />
                    </View>
                ) : wallets.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyTitle}>{t.wallet.noWalletsYet}</Text>
                        <TouchableOpacity onPress={openAddWallet} accessibilityRole="link">
                            <Text style={styles.emptyLink}>{t.wallet.addWallet}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
                            <Text style={styles.sectionLabel}>{t.wallet.multiCoinWallets}</Text>
                            <View style={styles.listCard}>
                                {wallets.map((wallet, index) => (
                                    <TouchableOpacity
                                        key={wallet.id}
                                        style={[styles.row, index > 0 && styles.rowDivider]}
                                        activeOpacity={0.75}
                                        onPress={() => void handleSelectWallet(wallet)}
                                        disabled={busyId === wallet.id}
                                    >
                                        <View>
                                            <View style={styles.iconWrap}>
                                                <svg.WalletSvg
                                                    color={colors.accentBlue}
                                                    size={22}
                                                    variant="outline"
                                                />
                                            </View>
                                            {wallet.isActive ? (
                                                <View style={styles.activeBadge}>
                                                    <Text style={styles.activeCheck}>✓</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                        <Text style={styles.name} numberOfLines={1}>
                                            {wallet.name}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.menuBtn}
                                            onPress={() => openWalletMenu(wallet)}
                                            accessibilityRole="button"
                                            accessibilityLabel={t.wallet.walletOptions}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Text
                                                style={{
                                                    color: colors.bodyTextColor,
                                                    fontSize: 22,
                                                    lineHeight: 22,
                                                    fontWeight: "700"}}
                                            >
                                                ⋮
                                            </Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={openAddWallet}
                                accessibilityRole="button"
                            >
                                <Text style={styles.actionBtnText}>{t.wallet.addWallet}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </SafeAreaView>

            <Modal
                visible={Boolean(menuTarget)}
                transparent
                animationType="fade"
                onRequestClose={closeWalletMenu}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={closeWalletMenu} />
                    <View style={styles.menuCard}>
                        <Text style={styles.menuTitle} numberOfLines={1}>
                            {menuTarget?.name}
                        </Text>
                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                const wallet = menuTarget;
                                closeWalletMenu();
                                if (wallet) void openWalletAddresses(wallet);
                            }}
                        >
                            <Text style={styles.menuOptionText}>{t.wallet.viewAddresses}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                const wallet = menuTarget;
                                closeWalletMenu();
                                if (wallet) openRename(wallet);
                            }}
                        >
                            <Text style={styles.menuOptionText}>{t.wallet.renameWallet}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                const wallet = menuTarget;
                                closeWalletMenu();
                                if (wallet) handleDelete(wallet);
                            }}
                        >
                            <Text style={[styles.menuOptionText, styles.menuOptionDestructive]}>
                                {t.wallet.deleteWallet}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuOption} onPress={closeWalletMenu}>
                            <Text style={[styles.menuOptionText, styles.menuOptionCancel]}>
                                {t.common.cancel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={Boolean(renameTarget)}
                transparent
                animationType="fade"
                onRequestClose={() => setRenameTarget(null)}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setRenameTarget(null)} />
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t.wallet.renameWallet}</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={renameValue}
                            onChangeText={setRenameValue}
                            autoFocus
                            maxLength={40}
                            placeholder={t.wallet.walletNamePlaceholder}
                            placeholderTextColor={colors.bodyTextColor}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => setRenameTarget(null)}
                            >
                                <Text style={styles.modalBtnText}>{t.common.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtn} onPress={() => void submitRename()}>
                                <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>
                                    {t.common.save}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Wallets;
