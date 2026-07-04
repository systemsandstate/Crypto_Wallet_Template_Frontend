import { View, ScrollView, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";
import { components } from "../components";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { useTranslation } from "../hooks/useTranslation";

const bodyStyle = {
    ...theme.FONTS.Mulish_400Regular,
    fontSize: 16,
    lineHeight: 16 * 1.6,
    color: theme.COLORS.bodyTextColor,
    marginBottom: 24,
};

const headingStyle = {
    ...theme.FONTS.H4,
    color: theme.COLORS.mainDark,
    marginBottom: 14,
};

const PrivacyPolicy: React.FC = () => {
    const { t } = useTranslation();

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <SafeAreaView>
                <components.Header goBack={true} containerStyle={{ marginBottom: 20 }} />
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <Text style={{ ...theme.FONTS.H2, color: theme.COLORS.mainDark }}>
                        {t.legal.privacyTitle}
                    </Text>
                </View>
            </SafeAreaView>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: TAB_BAR_HEIGHT + 24 }}>
                {t.legal.privacySections.map((section) => (
                    <View key={section.title}>
                        <Text style={headingStyle}>{section.title}</Text>
                        <Text style={bodyStyle}>{section.body}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default PrivacyPolicy;
