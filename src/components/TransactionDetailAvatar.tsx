import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import ProfileAvatar from "./ProfileAvatar";
import { svg } from "../svg";
import { useTheme } from "../hooks/useTheme";
import type { CounterpartyLabel } from "../utils/resolveCounterpartyLabel";

type Props = {
    counterparty: CounterpartyLabel | null;
    isSend: boolean;
    size?: number;
};

const TransactionDetailAvatar: React.FC<Props> = ({ counterparty, isSend, size = 60 }) => {
    const { colors, FONTS, isDark } = useTheme();
    const badgeSize = Math.round(size * 0.38);
    const iconSize = Math.round(badgeSize * 0.52);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    alignSelf: "center",
                    marginBottom: 30,
                    width: size,
                    height: size,
                },
                avatar: {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                },
                badge: {
                    position: "absolute",
                    right: -2,
                    bottom: -2,
                    width: badgeSize,
                    height: badgeSize,
                    borderRadius: badgeSize / 2,
                    backgroundColor: colors.accentBlue,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: colors.bgColor,
                },
            }),
        [FONTS, badgeSize, colors.accentBlue, colors.bgColor, size]
    );

    const badge = (
        <View style={styles.badge}>
            {isSend ? (
                <svg.SendSvg color={colors.pureWhite} size={iconSize} />
            ) : (
                <svg.ReceiveSvg color={colors.pureWhite} size={iconSize} />
            )}
        </View>
    );

    if (counterparty?.kind === "self") {
        return (
            <View style={styles.wrap}>
                <ProfileAvatar size={size} showEdit={false} inline iconColor={colors.headerMuted} />
                {badge}
            </View>
        );
    }

    const avatarBackground =
        counterparty?.kind === "app"
            ? colors.accentBlue
            : counterparty?.kind === "contact"
              ? isDark
                  ? "rgba(255,255,255,0.12)"
                  : colors.surfaceMuted
              : isDark
                ? "rgba(255,255,255,0.08)"
                : colors.surfaceMuted;
    const avatarForeground =
        counterparty?.kind === "app" ? colors.pureWhite : isDark ? colors.headerMuted : colors.bodyTextColor;

    return (
        <View style={styles.wrap}>
            <View style={[styles.avatar, { backgroundColor: avatarBackground }]}>
                <svg.UserOneSvg color={avatarForeground} size={Math.round(size * 0.46)} />
            </View>
            {badge}
        </View>
    );
};

export default TransactionDetailAvatar;
