import { View, Text, TouchableOpacity, Platform, StyleSheet } from "react-native";
import LoadingSpinner from "./LoadingSpinner";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "../constants";

type Props = {
    containerStyle?: object;
    onPress?: () => void;
    title?: string;
    leading?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    size?: "default" | "compact";
};

const GRADIENT_COLORS = ["#96D9FE", "#1D5DA2"] as const;
const SOLID_COLOR = "#1D5DA2";

const Button: React.FC<Props> = ({
    title,
    onPress,
    containerStyle,
    leading,
    loading = false,
    disabled = false,
    size = "default",
}) => {
    const isDisabled = disabled || loading;
    const compact = size === "compact";
    const content = (
        <>
            {loading ? (
                <LoadingSpinner size={22} style={styles.loader} />
            ) : (
                leading
            )}
            <Text
                style={[
                    styles.label,
                    compact && styles.labelCompact,
                    leading && !loading ? styles.labelWithLeading : null,
                ]}
            >
                {title}
            </Text>
        </>
    );

    return (
        <View style={[styles.wrap, containerStyle]}>
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.85}
            >
                {Platform.OS === "android" ? (
                    <View
                        style={[
                            styles.inner,
                            compact && styles.innerCompact,
                            styles.innerSolid,
                            isDisabled && styles.innerDisabled,
                        ]}
                    >
                        {content}
                    </View>
                ) : (
                    <LinearGradient
                        colors={[...GRADIENT_COLORS]}
                        style={[styles.inner, compact && styles.innerCompact, isDisabled && styles.innerDisabled]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {content}
                    </LinearGradient>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        width: "100%",
    },
    inner: {
        width: "100%",
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        flexDirection: "row",
    },
    innerCompact: {
        height: 36,
        borderRadius: 8,
    },
    innerSolid: {
        backgroundColor: SOLID_COLOR,
    },
    innerDisabled: {
        opacity: 0.7,
    },
    loader: {
        marginRight: 8,
    },
    label: {
        color: theme.COLORS.pureWhite,
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 16,
    },
    labelCompact: {
        fontSize: 13,
    },
    labelWithLeading: {
        marginLeft: 10,
    },
});

export default Button;
