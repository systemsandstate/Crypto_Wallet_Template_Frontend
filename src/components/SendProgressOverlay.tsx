import { View, Text, Modal, StyleSheet } from "react-native";
import React, { useMemo } from "react";

import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import LoadingSpinner from "./LoadingSpinner";

export type SendProgressStep = "preparing" | "signing" | "broadcasting" | "done";

type Props = {
    visible: boolean;
    step: SendProgressStep;
};

const STEPS: SendProgressStep[] = ["preparing", "signing", "broadcasting", "done"];

const SendProgressOverlay: React.FC<Props> = ({ visible, step }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();

    const labels: Record<SendProgressStep, string> = {
        preparing: t.ux.sendStepPreparing,
        signing: t.ux.sendStepSigning,
        broadcasting: t.ux.sendStepBroadcasting,
        done: t.ux.sendStepDone,
    };

    const currentIndex = STEPS.indexOf(step);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 32,
                },
                card: {
                    width: "100%",
                    maxWidth: 320,
                    backgroundColor: colors.bgColor,
                    borderRadius: 16,
                    padding: 24,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                title: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 20,
                },
                track: {
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                    marginBottom: 16,
                },
                dot: {
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    marginHorizontal: 2,
                },
                dotActive: {
                    backgroundColor: colors.accentBlue,
                },
                dotDone: {
                    backgroundColor: colors.green,
                },
                status: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                },
            }),
        [FONTS, colors]
    );

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    {step !== "done" ? <LoadingSpinner size={40} /> : null}
                    <Text style={[styles.title, { marginTop: step !== "done" ? 16 : 0 }]}>
                        {labels[step]}
                    </Text>
                    <View style={styles.track}>
                        {STEPS.map((s, index) => (
                            <View
                                key={s}
                                style={[
                                    styles.dot,
                                    index <= currentIndex &&
                                        (step === "done" ? styles.dotDone : styles.dotActive),
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.status}>{t.ux.sendProgressHint}</Text>
                </View>
            </View>
        </Modal>
    );
};

export default SendProgressOverlay;
