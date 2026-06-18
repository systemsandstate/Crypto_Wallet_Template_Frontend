import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Shadow } from "react-native-shadow-2";

import { components } from "../components";
import { theme } from "../constants";

const ConfirmationCode: React.FC = ({ navigation }: any) => {
    const [isFocused, setIsFocused] = useState(0);

    const Number = () => {
        return (
            <View
                style={{
                    backgroundColor: theme.COLORS.white,
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                }}
            >
                <TextInput
                    style={{
                        textAlign: "center",
                        flex: 1,
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                />
            </View>
        );
    };

    const renderHeader = () => {
        return (
            <components.Header
                title={"Verify your phone number"}
                goBack={true}
            />
        );
    };

    const renderContent = () => {
        return (
            <KeyboardAwareScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 20,
                    paddingTop: 10,
                }}
                enableOnAndroid={true}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={{
                        paddingTop: 30,
                        paddingBottom: 50,
                    }}
                >
                    <Text
                        style={{
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 16,
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
                            justifyContent: "space-between",
                            marginBottom: 30,
                        }}
                    >
                        <Number />
                        <Number />
                        <Number />
                        <Number />
                        <Number />
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 16,
                                lineHeight: 16 * 1.7,
                                color: theme.COLORS.bodyTextColor,
                            }}
                        >
                            Didn’t receive the OTP?{" "}
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
            </KeyboardAwareScrollView>
        );
    };

    return (
        <SafeAreaView
            style={{ backgroundColor: theme.COLORS.bgColor, flex: 1 }}
        >
            {renderHeader()}
            {renderContent()}
        </SafeAreaView>
    );
};

export default ConfirmationCode;
