import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import LoadingSpinner from "./LoadingSpinner";
import React, { useMemo } from "react";

import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";

type Props = {
    containerStyle?: object;
    onPress?: (event?: { preventDefault?: () => void }) => void;
    title?: string;
    leading?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    size?: "default" | "compact";
    variant?: "primary" | "secondary";
};

const Button: React.FC<Props> = ({
    title,
    onPress,
    containerStyle,
    leading,
    loading = false,
    disabled = false,
    size = "default",
    variant = "primary",
}) => {
    const { colors, FONTS } = useTheme();
    const isDisabled = disabled || loading;
    const compact = size === "compact";
    const primary = variant === "primary";

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    width: "100%",
                },
                inner: {
                    width: "100%",
                    height: compact ? DENSITY.buttonHeightCompact : DENSITY.buttonHeight,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: compact ? 8 : 10,
                    flexDirection: "row",
                    backgroundColor: primary ? colors.accentBlue : colors.white,
                    borderWidth: primary ? 0 : 1,
                    borderColor: colors.border,
                },
                innerDisabled: {
                    opacity: 0.55,
                },
                loader: {
                    marginRight: 8,
                },
                label: {
                    color: primary ? colors.pureWhite : colors.mainDark,
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: compact ? 13 : 14,
                    letterSpacing: 0.2,
                },
                labelWithLeading: {
                    marginLeft: 10,
                },
            }),
        [FONTS, colors, compact, primary]
    );

    return (
        <View style={[styles.wrap, containerStyle]}>
            <TouchableOpacity
                onPress={(event) => onPress?.(event as { preventDefault?: () => void })}
                disabled={isDisabled}
                activeOpacity={0.88}
            >
                <View style={[styles.inner, isDisabled && styles.innerDisabled]}>
                    {loading ? (
                        <LoadingSpinner
                            size={22}
                            shellColor={primary ? "rgba(255,255,255,0.3)" : colors.border}
                            arcColor={primary ? colors.pureWhite : colors.accentBlue}
                        />
                    ) : (
                        leading
                    )}
                    <Text
                        style={[
                            styles.label,
                            leading && !loading ? styles.labelWithLeading : null,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default Button;
