import {
    View,
    TouchableOpacity,
    ScrollView,
    Text,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Accordion from "react-native-collapsible/Accordion";

import { svg } from "../svg";
import { theme } from "../constants";
import { components } from "../components";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { useTranslation } from "../hooks/useTranslation";
import type { FaqItem } from "../i18n/types";

const FAQ: React.FC = () => {
    const { t } = useTranslation();
    const [activeSections, setActiveSections] = useState<number[]>([]);

    const setSections = (sections: number[]) => {
        setActiveSections(sections.includes(undefined as unknown as number) ? [] : sections);
    };

    const renderHeader = () => (
        <View>
            <SafeAreaView>
                <components.Header goBack={true} containerStyle={{ marginBottom: 20 }} />
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <Text style={{ ...theme.FONTS.H2, color: theme.COLORS.mainDark }}>
                        {t.legal.faqTitle}
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
                    ...theme.FONTS.H5,
                    textTransform: "capitalize",
                    color: isActive ? theme.COLORS.linkColor : theme.COLORS.mainDark,
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
                    ...theme.FONTS.Mulish_400Regular,
                    fontSize: 16,
                    lineHeight: 15 * 1.7,
                }}
            >
                {section.answer}
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            {renderHeader()}
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: 20,
                    paddingBottom: TAB_BAR_HEIGHT + 24,
                }}
            >
                <Accordion
                    activeSections={activeSections}
                    sections={t.legal.faqItems}
                    touchableComponent={TouchableOpacity}
                    renderHeader={renderFaqHeader}
                    renderContent={renderContent}
                    duration={400}
                    onChange={setSections}
                    underlayColor={theme.COLORS.linkColor}
                    sectionContainerStyle={{
                        backgroundColor: theme.COLORS.white,
                        marginBottom: 8,
                        borderColor: theme.COLORS.linkColor,
                        marginHorizontal: 20,
                        borderRadius: 10,
                    }}
                />
            </ScrollView>
        </View>
    );
};

export default FAQ;
