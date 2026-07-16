import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    useWindowDimensions,
    Pressable,
    Modal,
    Animated,
    Easing,
    Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDispatch } from "react-redux";

import { svg } from "../svg";
import { AppLocale, LOCALES } from "../i18n";
import LocaleFlag from "./LocaleFlag";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { navigationRef } from "../navigation/navigationRef";
import { logoutAndNavigateToSignIn } from "../navigation/logoutAndNavigateToSignIn";
import { unregisterPushTokenFromBackend } from "../services/pushNotifications";
import { confirmAction } from "../utils/confirm";
import type { AppColors } from "../constants/theme";
import { FONTS } from "../constants/theme";
import { MENU_ICON_SIZE } from "../constants/menuIcon";
import { DENSITY } from "../constants/density";

const LANGUAGE_OPTIONS: AppLocale[] = ["es", "en"];

type SettingsRowProps = {
    icon: React.ReactNode;
    title: string;
    onPress?: () => void;
    trailing?: React.ReactNode;
    colors: AppColors;
};

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, title, onPress, trailing, colors }) => {
    const content = (
        <>
            <View style={styles.menuIconSlot}>{icon}</View>
            <Text style={[styles.menuRowTitle, { color: colors.mainDark }]} numberOfLines={1}>
                {title}
            </Text>
            <View style={styles.menuRowTrailing}>{trailing ?? <svg.ArrowOneSvg />}</View>
        </>
    );

    if (!onPress) {
        return <View style={styles.menuRow}>{content}</View>;
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.rowPress }]}
            onPress={onPress}
            accessibilityRole="button"
        >
            {content}
        </Pressable>
    );
};

const navigateProfileScreen = (screen: "MyWallet" | "ProfileMain") => {
    if (!navigationRef.isReady()) return;
    if (screen === "ProfileMain") {
        navigationRef.navigate("TabNavigator", { screen: "Profile" });
        return;
    }
    navigationRef.navigate(screen);
};

type HeaderMenuButtonProps = {
    /** Transparent trigger for use on the navy header bar. */
    variant?: "default" | "onHeader";
    /** Match compact header icon buttons on the dashboard. */
    triggerStyle?: "default" | "header";
};

const HeaderMenuButton: React.FC<HeaderMenuButtonProps> = ({
    variant = "default",
    triggerStyle = "default",
}) => {
    const dispatch = useDispatch();
    const [modalVisible, setModalVisible] = useState(false);
    const [languageExpanded, setLanguageExpanded] = useState(false);
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { t, locale, setLocale } = useTranslation();
    const { colors, isDark, setDarkMode } = useTheme();
    const onHeader = variant === "onHeader";
    const compactHeaderTrigger = triggerStyle === "header";
    const triggerSize = compactHeaderTrigger ? 36 : 40;
    const triggerIconSize = compactHeaderTrigger ? MENU_ICON_SIZE : 22;

    // Web: compact right drawer. Mobile: most of the screen, capped for tablets.
    const panelWidth = useMemo(() => {
        if (Platform.OS === "web") {
            if (width >= 900) return 380;
            if (width >= 600) return Math.min(360, Math.round(width * 0.42));
            return Math.min(340, Math.round(width * 0.88));
        }
        return Math.min(360, Math.round(width * 0.86));
    }, [width]);
    const slideX = useRef(new Animated.Value(panelWidth)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0.35)).current;
    const glowScale = useRef(new Animated.Value(1)).current;
    const isClosingRef = useRef(false);

    useEffect(() => {
        const glowLoop = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(glowOpacity, {
                        toValue: 0.9,
                        duration: 1400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowOpacity, {
                        toValue: 0.3,
                        duration: 1400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(glowScale, {
                        toValue: 1.35,
                        duration: 1400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowScale, {
                        toValue: 1,
                        duration: 1400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        glowLoop.start();
        return () => glowLoop.stop();
    }, [glowOpacity, glowScale]);

    const runOpenAnimation = () => {
        slideX.setValue(panelWidth);
        backdropOpacity.setValue(0);
        requestAnimationFrame(() => {
            Animated.parallel([
                Animated.timing(slideX, {
                    toValue: 0,
                    duration: 280,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 280,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const openPanel = () => {
        isClosingRef.current = false;
        setModalVisible(true);
        runOpenAnimation();
    };

    const close = (onClosed?: () => void) => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;
        setLanguageExpanded(false);
        Animated.parallel([
            Animated.timing(slideX, {
                toValue: panelWidth,
                duration: 220,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 220,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            isClosingRef.current = false;
            if (finished) {
                setModalVisible(false);
                onClosed?.();
            }
        });
    };

    useEffect(() => {
        if (!modalVisible) {
            slideX.setValue(panelWidth);
        }
    }, [panelWidth, modalVisible, slideX]);

    const toggleLanguage = () => {
        setLanguageExpanded((expanded) => !expanded);
    };

    const selectLanguage = (code: AppLocale) => {
        setLocale(code);
        setLanguageExpanded(false);
    };

    const openHelp = () => {
        close(() => {
            if (navigationRef.isReady()) {
                navigationRef.navigate("WalletHelp");
            }
        });
    };

    const openAddressBook = () => {
        close(() => {
            if (navigationRef.isReady()) {
                navigationRef.navigate("AddressBook");
            }
        });
    };

    const openMyWallet = () => {
        close(() => navigateProfileScreen("MyWallet"));
    };

    const openProfile = () => {
        close(() => navigateProfileScreen("ProfileMain"));
    };

    const handleLogout = () => {
        close(() => {
            confirmAction({
                title: t.auth.signOutConfirm,
                message: t.auth.signOutMessage,
                confirmLabel: t.auth.signOut,
                cancelLabel: t.common.cancel,
                destructive: true,
                onConfirm: () => {
                    void unregisterPushTokenFromBackend();
                    logoutAndNavigateToSignIn(dispatch);
                },
            });
        });
    };

    const panelIconColor = colors.icon;

    const triggerStyles = useMemo(
        () =>
            StyleSheet.create({
                menuButtonWrap: {
                    width: triggerSize,
                    height: triggerSize,
                    alignItems: "center",
                    justifyContent: "center",
                },
                menuButton: {
                    width: triggerSize,
                    height: triggerSize,
                    borderRadius: triggerSize / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: compactHeaderTrigger ? colors.bgColor : colors.surfaceMuted,
                    borderWidth: compactHeaderTrigger ? 1 : 0,
                    borderColor: compactHeaderTrigger ? colors.border : colors.transparent,
                    ...(Platform.OS === "web"
                        ? ({
                              cursor: "pointer",
                          } as object)
                        : {}),
                },
            }),
        [colors.bgColor, colors.border, colors.surfaceMuted, colors.transparent, compactHeaderTrigger, triggerSize]
    );

    const gearColor = colors.icon;

    const panelStyles = useMemo(
        () =>
            StyleSheet.create({
                panel: {
                    flex: 1,
                    backgroundColor: colors.white,
                    borderTopLeftRadius: 16,
                    borderBottomLeftRadius: 16,
                    ...(Platform.OS === "web"
                        ? ({
                              boxShadow: "-4px 0 16px rgba(0, 0, 0, 0.08)",
                              maxWidth: "100%",
                          } as object)
                        : {
                              shadowColor: "#000",
                              shadowOffset: { width: -4, height: 0 },
                              shadowOpacity: 0.2,
                              shadowRadius: 12,
                              elevation: 16,
                          }),
                },
                panelHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    height: 56,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                panelTitle: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 17,
                    color: colors.mainDark,
                    textAlign: "center",
                    flex: 1,
                },
                valueText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                },
                expandChevron: {
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginLeft: 2,
                },
                languageOptions: {
                    marginLeft: 56,
                    marginRight: 20,
                    marginBottom: 4,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: colors.surfaceMuted,
                },
                languageOptionBorder: {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                languageOptionSelected: {
                    backgroundColor: colors.selectedBg,
                },
                languageOptionLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.mainDark,
                    marginLeft: 10,
                },
                languageOptionLabelSelected: {
                    color: colors.accentBlue,
                },
                languageOptionCode: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                },
                languageOptionCodeSelected: {
                    color: colors.accentBlue,
                },
                divider: {
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: colors.border,
                    marginLeft: 56,
                },
            }),
        [colors, isDark]
    );

    return (
        <>
            <View style={triggerStyles.menuButtonWrap}>
                <TouchableOpacity
                    style={triggerStyles.menuButton}
                    onPress={openPanel}
                    accessibilityRole="button"
                    accessibilityLabel={t.common.settings}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <svg.SettingsGearSvg color={gearColor} size={triggerIconSize} />
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => close()}
            >
                <View style={styles.modalRoot}>
                    <Animated.View
                        style={[styles.backdrop, { opacity: backdropOpacity }]}
                        pointerEvents={modalVisible ? "auto" : "none"}
                    >
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityRole="button" />
                    </Animated.View>
                    <Animated.View
                        style={[
                            panelStyles.panel,
                            styles.panelPosition,
                            {
                                width: panelWidth,
                                paddingTop: insets.top,
                                paddingBottom: Math.max(insets.bottom, 16),
                                transform: [{ translateX: slideX }],
                            },
                        ]}
                    >
                        <View style={panelStyles.panelHeader}>
                            <TouchableOpacity
                                onPress={() => close()}
                                style={styles.backButton}
                                accessibilityRole="button"
                                accessibilityLabel={t.common.back}
                            >
                                <svg.GoBackSvg goBackColor={panelIconColor} />
                            </TouchableOpacity>
                            <Text style={panelStyles.panelTitle}>{t.common.settings}</Text>
                            <View style={styles.headerSpacer} />
                        </View>

                        <View style={styles.settingsGroup}>
                            <SettingsRow
                                icon={<svg.MyWalletSvg color={panelIconColor} size={MENU_ICON_SIZE} />}
                                title={t.wallet.myWalletTitle}
                                onPress={openMyWallet}
                                colors={colors}
                            />
                            <View style={panelStyles.divider} />
                            <SettingsRow
                                icon={<svg.ProfileTabSvg color={panelIconColor} size={MENU_ICON_SIZE} />}
                                title={t.profile.yourAccount}
                                onPress={openProfile}
                                colors={colors}
                            />
                            <View style={panelStyles.divider} />
                            <SettingsRow
                                icon={<svg.LanguageSvg color={panelIconColor} size={MENU_ICON_SIZE} />}
                                title={t.language.title}
                                onPress={toggleLanguage}
                                colors={colors}
                                trailing={
                                    <View style={styles.valueTrailing}>
                                        <LocaleFlag locale={locale} size={18} />
                                        <Text style={panelStyles.valueText}>{LOCALES[locale].label}</Text>
                                        <Text style={panelStyles.expandChevron}>
                                            {languageExpanded ? "▴" : "▾"}
                                        </Text>
                                    </View>
                                }
                            />

                            {languageExpanded ? (
                                <View style={panelStyles.languageOptions}>
                                    {LANGUAGE_OPTIONS.map((code, index) => {
                                        const selected = code === locale;
                                        const label =
                                            code === "es" ? t.language.spanish : t.language.english;
                                        return (
                                            <Pressable
                                                key={code}
                                                style={({ pressed }) => [
                                                    styles.languageOption,
                                                    index < LANGUAGE_OPTIONS.length - 1 &&
                                                        panelStyles.languageOptionBorder,
                                                    selected && panelStyles.languageOptionSelected,
                                                    pressed && !selected
                                                        ? { backgroundColor: colors.rowPress }
                                                        : null,
                                                ]}
                                                onPress={() => selectLanguage(code)}
                                                accessibilityRole="button"
                                                accessibilityState={{ selected }}
                                            >
                                                <View style={styles.languageOptionLeft}>
                                                    <LocaleFlag locale={code} size={22} />
                                                    <Text
                                                        style={[
                                                            panelStyles.languageOptionLabel,
                                                            selected && panelStyles.languageOptionLabelSelected,
                                                        ]}
                                                    >
                                                        {label}
                                                    </Text>
                                                </View>
                                                <View style={styles.languageOptionRight}>
                                                    <Text
                                                        style={[
                                                            panelStyles.languageOptionCode,
                                                            selected && panelStyles.languageOptionCodeSelected,
                                                        ]}
                                                    >
                                                        {LOCALES[code].label}
                                                    </Text>
                                                    {selected ? (
                                                        <View style={styles.checkSlot}>
                                                            <svg.CheckSvg />
                                                        </View>
                                                    ) : (
                                                        <View style={styles.checkSlot} />
                                                    )}
                                                </View>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ) : null}

                            <View style={panelStyles.divider} />
                            <SettingsRow
                                icon={<svg.MoonSvg color={panelIconColor} size={MENU_ICON_SIZE} />}
                                title={t.common.darkMode}
                                colors={colors}
                                trailing={
                                    <Switch
                                        value={isDark}
                                        onValueChange={setDarkMode}
                                        trackColor={{
                                            false: colors.border,
                                            true: colors.accentBlue,
                                        }}
                                        thumbColor={colors.pureWhite}
                                        accessibilityLabel={t.common.darkMode}
                                    />
                                }
                            />
                            <View style={panelStyles.divider} />
                            <SettingsRow
                                icon={<svg.AddressBookSvg color={panelIconColor} size={MENU_ICON_SIZE} />}
                                title={t.common.addressBook}
                                onPress={openAddressBook}
                                colors={colors}
                            />
                            <View style={panelStyles.divider} />
                            <SettingsRow
                                icon={<svg.HelpQuestionSvg color={panelIconColor} size={MENU_ICON_SIZE} />}
                                title={t.common.help}
                                onPress={openHelp}
                                colors={colors}
                            />
                            <View style={panelStyles.divider} />
                            <SettingsRow
                                icon={<svg.LogOutSvg color={colors.linkColor} size={MENU_ICON_SIZE} />}
                                title={t.auth.signOut}
                                onPress={handleLogout}
                                colors={colors}
                            />
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalRoot: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    panelPosition: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: -8,
    },
    headerSpacer: {
        width: 40,
    },
    settingsGroup: {
        paddingTop: 8,
    },
    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        minHeight: 56,
    },
    menuIconSlot: {
        width: MENU_ICON_SIZE,
        height: MENU_ICON_SIZE,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    menuRowTitle: {
        flex: 1,
        ...FONTS.Mulish_600SemiBold,
        fontSize: 16,
        minWidth: 0,
    },
    menuRowTrailing: {
        marginLeft: 12,
        flexShrink: 0,
    },
    valueTrailing: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    languageOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    languageOptionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
    },
    languageOptionRight: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
    },
    checkSlot: {
        width: 20,
        alignItems: "center",
        marginLeft: 8,
    },
});

export default HeaderMenuButton;
