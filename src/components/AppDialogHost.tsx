import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Modal, Pressable, StyleSheet, TouchableOpacity } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { dismissDialog, subscribeDialog, type DialogPayload } from "../utils/dialog";

const AppDialogHost: React.FC = () => {
    const { colors, FONTS } = useTheme();
    const [dialog, setDialog] = useState<DialogPayload | null>(null);

    useEffect(() => subscribeDialog(setDialog), []);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: colors.overlay,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                card: {
                    width: "100%",
                    maxWidth: 360,
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    overflow: "hidden",
                },
                title: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 18,
                    color: colors.mainDark,
                    paddingHorizontal: 20,
                    paddingTop: 20,
                    paddingBottom: 8,
                },
                message: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                    lineHeight: 22,
                },
                option: {
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                },
                optionText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.accentBlue,
                    textAlign: "center",
                },
                optionDestructive: {
                    color: colors.linkColor,
                },
                optionCancel: {
                    color: colors.bodyTextColor,
                },
            }),
        [FONTS, colors]
    );

    if (!dialog) return null;

    return (
        <Modal visible transparent animationType="fade" onRequestClose={dismissDialog}>
            <View style={styles.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={dismissDialog} />
                <View style={styles.card}>
                    <Text style={styles.title}>{dialog.title}</Text>
                    {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
                    {dialog.buttons.map((button, index) => (
                        <TouchableOpacity
                            key={`${button.text}-${index}`}
                            style={styles.option}
                            onPress={button.onPress}
                            accessibilityRole="button"
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    button.style === "destructive" && styles.optionDestructive,
                                    button.style === "cancel" && styles.optionCancel,
                                ]}
                            >
                                {button.text}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );
};

export default AppDialogHost;
