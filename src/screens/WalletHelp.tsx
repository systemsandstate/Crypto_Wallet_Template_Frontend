import {
    View,
    TouchableOpacity,
    ScrollView,
    Text,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Accordion from "react-native-collapsible/Accordion";

import { svg } from "../svg";
import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import type { FaqItem } from "../i18n/types";

const WalletHelp: React.FC = () => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const [activeSections, setActiveSections] = useState<number[]>([]);

    const setSections = (sections: number[]) => {
        setActiveSections(sections.includes(undefined as unknown as number) ? [] : sections);
    };

    const renderHeader = () => (
        <View>
            <SafeAreaView>
                <components.Header goBack={true} containerStyle={{ marginBottom: 20 }} />
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <Text style={{ ...FONTS.H2, color: colors.mainDark }}>
                        {t.wallet.helpTitle}
                    </Text>
                    <Text
                        style={{
                            ...FONTS.Mulish_400Regular,
                            fontSize: 14,
                            lineHeight: 14 * 1.6,
                            color: colors.bodyTextColor,
                            marginTop: 8,
                        }}
                    >
                        {t.wallet.helpIntro}
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );

    const renderFaqHeader = (section: FaqItem, _: number, isActive: boolean) => (
        <View
            style={{
                paddingVertical: 18,
                marginLeft: 20,
                marginRight: 18,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <Text
                style={{
                    ...FONTS.H5,
                    textTransform: "capitalize",
                    color: isActive ? colors.linkColor : colors.mainDark,
                    flex: 1,
                    marginRight: 8,
                }}
            >
                {section.question}
            </Text>
            {isActive ? <svg.QuestionCloseSvg /> : <svg.QuestionOpenSvg />}
        </View>
    );

    const renderContent = (section: FaqItem) => (
        <View style={{ marginHorizontal: 20, paddingBottom: 20 }}>
            <Text
                style={{
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                    lineHeight: 15 * 1.7,
                    color: colors.bodyTextColor,
                }}
            >
                {section.answer}
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            {renderHeader()}
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: 20,
                    paddingBottom: Math.max(insets.bottom, 24) + 16,
                }}
            >
                <Accordion
                    activeSections={activeSections}
                    sections={t.wallet.helpItems}
                    touchableComponent={TouchableOpacity}
                    renderHeader={renderFaqHeader}
                    renderContent={renderContent}
                    duration={400}
                    onChange={setSections}
                    underlayColor={colors.linkColor}
                    sectionContainerStyle={{
                        backgroundColor: colors.white,
                        marginBottom: 8,
                        borderColor: colors.linkColor,
                        marginHorizontal: 20,
                        borderRadius: 10,
                    }}
                />
            </ScrollView>
        </View>
    );
};

export default WalletHelp;
