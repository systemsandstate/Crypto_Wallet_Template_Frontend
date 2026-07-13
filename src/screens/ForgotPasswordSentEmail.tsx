import { View, Text, ScrollView, Image } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";
import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";

const ForgotPasswordSentEmail: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const mode: "email_sent" | "success" = route.params?.mode || "success";
    const isEmailSent = mode === "email_sent";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ paddingTop: "16%", paddingHorizontal: 20 }}>
                    <Image
                        source={require("../assets/reset.png")}
                        style={{ width: 140, height: 96, alignSelf: "center", marginBottom: 24 }}
                    />
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.H2,
                            color: theme.COLORS.mainDark,
                            marginBottom: 20,
                        }}
                    >
                        {isEmailSent ? t.auth.checkEmail : t.auth.passwordResetSuccess}
                    </Text>
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 16,
                            color: theme.COLORS.bodyTextColor,
                            lineHeight: 16 * 1.6,
                            marginBottom: "20%",
                        }}
                    >
                        {isEmailSent ? t.auth.resetEmailSent : t.auth.passwordResetDone}
                    </Text>
                    <components.Button
                        title={isEmailSent ? t.auth.backToSignIn : t.common.done}
                        onPress={() => navigation.navigate("SignIn")}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ForgotPasswordSentEmail;
