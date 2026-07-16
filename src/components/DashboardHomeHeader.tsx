import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { svg } from "../svg";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";
import { DENSITY } from "../constants/density";
import { MENU_ICON_SIZE } from "../constants/menuIcon";
import HeaderMenuButton from "./HeaderMenuButton";
import KivooLogo from "./KivooLogo";

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
                safe: {
                    backgroundColor: colors.white,
                },
                bar: {
                    backgroundColor: colors.white,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                    paddingLeft: 10,
                    paddingRight: DENSITY.pagePaddingH,
                    paddingVertical: 8,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                },
                brand: {
                    flexShrink: 0,
                    marginRight: 8,
                    alignItems: "flex-start",
                    justifyContent: "center",
                },
                greeting: {
                    flex: 1,
                    minWidth: 0,
                    marginRight: 8,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                },
                greetingName: {
                    ...FONTS.Mulish_700Bold,
                    color: colors.mainDark,
                },
                actions: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                },
                iconBtn: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.bgColor,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                },
            }),
        [FONTS, colors]
    );

    return (
        <SafeAreaView edges={["top"]} style={styles.safe}>
            <View style={styles.bar}>
                <View style={styles.row}>
                    <View style={styles.brand}>
                        <KivooLogo size="header" />
                    </View>
                    <Text style={styles.greeting} numberOfLines={1}>
                        {t.dashboard.hello} <Text style={styles.greetingName}>{name}</Text>
                    </Text>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={onNotificationsPress}
                            disabled={!onNotificationsPress}
                            accessibilityRole="button"
                            accessibilityLabel={t.dashboard.notifications}
                        >
                            <svg.NotificationSvg color={colors.icon} size={MENU_ICON_SIZE} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={onBalancePress}
                            disabled={!onBalancePress}
                            accessibilityRole="button"
                            accessibilityLabel={t.balance.viewBalanceDetails}
                        >
                            <svg.WalletSvg color={colors.accentBlue} size={MENU_ICON_SIZE} />
                        </TouchableOpacity>
                        <HeaderMenuButton variant="default" triggerStyle="header" />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default DashboardHomeHeader;
