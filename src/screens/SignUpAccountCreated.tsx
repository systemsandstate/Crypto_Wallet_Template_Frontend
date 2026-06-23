import { View, ScrollView, Image, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";
import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";

const SignUpAccountCreated: React.FC = ({ navigation }: any) => {
    const { t } = useTranslation();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <Image
                    source={require("../assets/bg-02.png")}
                    style={{ width: "100%", height: 530, position: "absolute" }}
                />
                <View style={{ paddingTop: "20%", paddingHorizontal: 20 }}>
                    <Image
                        source={require("../assets/account.png")}
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
                        {t.auth.accountCreated}
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
                        {t.auth.accountCreatedMessage}
                    </Text>
                    <components.Button
                        title={t.auth.goToDashboard}
                        onPress={() => navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] })}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignUpAccountCreated;
