import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../hooks/useTheme";
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

    return (
        <View
            style={[
                styles.host,
                {
                    bottom: Math.max(insets.bottom, 16) + 16,
                    backgroundColor: isError ? "#5c2a2a" : colors.mainDark,
                },
            ]}
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            accessibilityRole="text"
        >
            <Text style={[styles.text, { ...FONTS.Mulish_600SemiBold }]}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    host: {
        position: "absolute",
        left: 24,
        right: 24,
        alignSelf: "center",
        maxWidth: 420,
        marginHorizontal: "auto",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        zIndex: 9999,
        ...(Platform.OS === "web"
            ? ({
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              } as object)
            : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
              }),
    },
    text: {
        color: "#fff",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
});

export default ToastHost;
