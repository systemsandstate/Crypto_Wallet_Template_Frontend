import { View, Text, ScrollView, Image } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";
import { components } from "../components";

const ForgotPasswordSentEmail: React.FC = ({ navigation, route }: any) => {
    const mode: "email_sent" | "success" = route.params?.mode || "success";
    const isEmailSent = mode === "email_sent";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <Image
                    source={require("../assets/bg-02.png")}
                    style={{ width: "100%", height: 530, position: "absolute" }}
                />
                <View style={{ paddingTop: theme.SIZES.height * 0.2, paddingHorizontal: 20 }}>
                    <Image
                        source={require("../assets/reset.png")}
                        style={{ width: 161, height: 111, alignSelf: "center", marginBottom: 30 }}
                    />
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.H2,
                            color: theme.COLORS.mainDark,
                            marginBottom: 20,
                        }}
                    >
                        {isEmailSent ? "Check your email" : "Your password\nhas been reset!"}
                    </Text>
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 16,
                            color: theme.COLORS.bodyTextColor,
                            lineHeight: 16 * 1.6,
                            marginBottom: theme.SIZES.height * 0.2,
                        }}
                    >
                        {isEmailSent
                            ? "If an account exists for that email, we sent a link to reset your password."
                            : "You can now sign in with your new password."}
                    </Text>
                    <components.Button
                        title={isEmailSent ? "Back to sign in" : "Done"}
                        onPress={() => navigation.navigate("SignIn")}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ForgotPasswordSentEmail;
