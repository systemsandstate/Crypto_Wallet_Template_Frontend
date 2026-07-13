import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { svg } from "../svg";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";
import { DENSITY } from "../constants/density";
import { MENU_ICON_SIZE } from "../constants/menuIcon";
import ProfileAvatar from "./ProfileAvatar";
import HeaderMenuButton from "./HeaderMenuButton";

type Props = {
    name: string;
    onNotificationsPress?: () => void;
    onBalancePress?: () => void;
};

const DashboardHomeHeader: React.FC<Props> = ({
    name,
    onNotificationsPress,
    onBalancePress,
}) => {
    const { colors, FONTS } = useTheme();
    const { t } = useTranslation();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    paddingBottom: 4,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                },
                left: {
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    minWidth: 0,
                    gap: 10,
                },
                greeting: {
                    flex: 1,
                    minWidth: 0,
                },
                greetingHello: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                },
                greetingName: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 14,
                    color: colors.mainDark,
                },
                actions: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                },
                iconBtn: {
                    width: DENSITY.iconButton,
                    height: DENSITY.iconButton,
                    borderRadius: DENSITY.iconButton / 2,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                },
                menuSlot: {
                    width: DENSITY.iconButton,
                    height: DENSITY.iconButton,
                    alignItems: "center",
                    justifyContent: "center",
                },
            }),
        [FONTS, colors]
    );

    return (
        <SafeAreaView edges={["top"]}>
            <View style={styles.wrap}>
                <View style={styles.row}>
                    <View style={styles.left}>
                        <ProfileAvatar
                            size={DENSITY.avatarHeader}
                            showEdit={false}
                            inline
                            iconColor={colors.icon}
                        />
                        <Text style={styles.greeting} numberOfLines={1}>
                            <Text style={styles.greetingHello}>{t.dashboard.hello} </Text>
                            <Text style={styles.greetingName}>{name}</Text>
                        </Text>
                    </View>
                    <View style={styles.actions}>
                        {onNotificationsPress ? (
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={onNotificationsPress}
                                accessibilityRole="button"
                                accessibilityLabel={t.dashboard.notifications}
                            >
                                <svg.NotificationSvg color={colors.icon} size={MENU_ICON_SIZE} />
                            </TouchableOpacity>
                        ) : null}
                        {onBalancePress ? (
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={onBalancePress}
                                accessibilityRole="button"
                                accessibilityLabel={t.balance.viewBalanceDetails}
                            >
                                <svg.WalletSvg color={colors.accentBlue} size={MENU_ICON_SIZE} />
                            </TouchableOpacity>
                        ) : null}
                        <View style={styles.menuSlot}>
                            <HeaderMenuButton variant="default" triggerStyle="header" />
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default DashboardHomeHeader;
