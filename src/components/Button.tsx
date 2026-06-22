import { View, Text, TouchableOpacity, Platform, StyleSheet, ActivityIndicator } from "react-native";
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
}) => {
    const isDisabled = disabled || loading;
    const content = (
        <>
            {loading ? (
                <ActivityIndicator color={theme.COLORS.white} style={styles.loader} />
            ) : (
                leading
            )}
            <Text style={[styles.label, leading && !loading ? styles.labelWithLeading : null]}>
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
                    <View style={[styles.inner, styles.innerSolid, isDisabled && styles.innerDisabled]}>
                        {content}
                    </View>
                ) : (
                    <LinearGradient
                        colors={[...GRADIENT_COLORS]}
                        style={[styles.inner, isDisabled && styles.innerDisabled]}
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
        color: theme.COLORS.white,
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 16,
    },
    labelWithLeading: {
        marginLeft: 10,
    },
});

export default Button;
