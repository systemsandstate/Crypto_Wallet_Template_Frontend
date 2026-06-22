import { View, Text, TextInput, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { theme } from "../constants";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

const OTP_LENGTH = 5;

const OtpBox: React.FC<{ size: number }> = ({ size }) => (
    <View
        style={{
            flex: 1,
            maxWidth: size,
            aspectRatio: 1,
            backgroundColor: theme.COLORS.white,
            borderRadius: 10,
            marginHorizontal: 4,
        }}
    >
        <TextInput
            style={{
                textAlign: "center",
                flex: 1,
                fontSize: size * 0.4,
            }}
            keyboardType="number-pad"
            maxLength={1}
        />
    </View>
);

const ConfirmationCode: React.FC = () => {
    const { width, horizontalPadding, isCompact } = useResponsiveLayout();
    const boxSize = Math.min(60, (width - horizontalPadding * 2 - 40) / OTP_LENGTH);

    return (
        <SafeAreaView style={{ backgroundColor: theme.COLORS.bgColor, flex: 1 }}>
            <components.Header title="Verify your phone number" goBack={true} />
            <components.FormScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: horizontalPadding,
                    paddingTop: 10,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingTop: 30, paddingBottom: 50 }}>
                    <Text
                        style={{
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: isCompact ? 15 : 16,
                            color: theme.COLORS.bodyTextColor,
                            marginBottom: 30,
                        }}
                    >
                        Enter your OTP code here.
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 30,
                        }}
                    >
                        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                            <OtpBox key={index} size={boxSize} />
                        ))}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                        <Text
                            style={{
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 16,
                                lineHeight: 16 * 1.7,
                                color: theme.COLORS.bodyTextColor,
                            }}
                        >
                            Didn't receive the OTP?{" "}
                        </Text>
                        <TouchableOpacity>
                            <Text
                                style={{
                                    ...theme.FONTS.Mulish_400Regular,
                                    fontSize: 16,
                                    lineHeight: 16 * 1.7,
                                    color: theme.COLORS.linkColor,
                                }}
                            >
                                Resend.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </components.FormScrollView>
        </SafeAreaView>
    );
};

export default ConfirmationCode;
