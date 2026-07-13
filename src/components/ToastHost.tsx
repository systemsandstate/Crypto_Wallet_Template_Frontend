import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../hooks/useTheme";
import { getTabBarOccupiedHeight } from "../hooks/useTabBarInset";
import { subscribeToast, ToastType } from "../utils/toast";

const ToastHost: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { colors, FONTS } = useTheme();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState<ToastType>("success");

    useEffect(() => {
        return subscribeToast((payload) => {
            if (!payload) {
                setVisible(false);
                return;
            }
            setMessage(payload.message);
            setType(payload.type);
            setVisible(true);
        });
    }, []);

    if (!visible) return null;

    const isError = type === "error";
    const backgroundColor = isError ? "#4A2222" : colors.mainDark;
    const textColor = isError ? "#FFEAEA" : colors.bgColor;
    const borderColor = isError ? "#E85858" : colors.accentBlue;

    const toastBottom = getTabBarOccupiedHeight(insets.bottom) + 72;

    return (
        <View
            style={[
                styles.host,
                {
                    bottom: toastBottom,
                    backgroundColor,
                    borderColor,
                },
            ]}
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
        >
            <Text style={[styles.text, { ...FONTS.Mulish_600SemiBold, color: textColor }]}>
                {message}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    host: {
        position: "absolute",
        left: 20,
        right: 20,
        alignSelf: "center",
        maxWidth: 420,
        marginHorizontal: "auto",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        zIndex: 9999,
        ...(Platform.OS === "web"
            ? ({
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.55)",
              } as object)
            : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 12,
              }),
    },
    text: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
    },
});

export default ToastHost;
