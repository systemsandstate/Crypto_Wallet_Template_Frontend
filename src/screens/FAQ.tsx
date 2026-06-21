import {
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    ImageBackground,
    Text,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Accordion from "react-native-collapsible/Accordion";

import { svg } from "../svg";
import { theme } from "../constants";
import { components } from "../components";
import { Shadow } from "react-native-shadow-2";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";

const frequentlyQuestions = [
    {
        id: "1",
        question: "Service description",
        answer: "Merchant Payments is a non-custodial merchant tool. The App creates USDT payment invoices on TRON, Ethereum, BNB Chain, Solana, or Polygon via OxaPay and records when payments are confirmed. We do not store or control customer cryptocurrency.",
    },
    {
        id: "2",
        question: "Merchant responsibilities",
        answer: "You are responsible for accurate invoice amounts, communicating payment instructions to customers, and complying with applicable laws in your jurisdiction. You must keep your login credentials secure.",
    },
    {
        id: "3",
        question: "Payment confirmation",
        answer: "Payments are marked PAID when OxaPay confirms settlement via webhook or status polling. Underpayments are not auto-confirmed and are flagged as failed with an amount-mismatch note.",
    },
    {
        id: "4",
        question: "Cancellations & expiry",
        answer: "Pending invoices can be cancelled before payment or expiry. Expired invoices cannot be paid through the original QR code. Create a new invoice for additional payment attempts.",
    },
    {
        id: "5",
        question: "Fees & settlement",
        answer: "Network and processor fees are determined by OxaPay and the blockchain. Settlement timing depends on OxaPay and your merchant configuration with them.",
    },
    {
        id: "6",
        question: "Account & support",
        answer: "You may update business profile and password in the App. For OxaPay account or payout issues, contact OxaPay support. For App access issues, contact your platform administrator.",
    },
];

const FAQ: React.FC = () => {
    const [activeSections, setActiveSections] = useState([]);

    const setSections = (sections: any) => {
        setActiveSections(sections.includes(undefined) ? [] : sections);
    };

    const renderHeader = () => {
        return (
            <View>
                <SafeAreaView>
                    <components.Header
                        goBack={true}
                        containerStyle={{ marginBottom: 20 }}
                    />
                    <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                        <Text style={{ ...theme.FONTS.H2, color: theme.COLORS.mainDark }}>
                            Terms of service
                        </Text>
                    </View>
                </SafeAreaView>
                <Image
                    source={require("../assets/bg-01.png")}
                    style={{
                        height: 350,
                        width: theme.SIZES.width,
                        position: "absolute",
                        zIndex: -1,
                    }}
                />
            </View>
        );
    };

    const renderFaqHeader = (section: any, _: any, isActive: any) => {
        return (
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
                        color: isActive
                            ? theme.COLORS.linkColor
                            : theme.COLORS.mainDark,
                    }}
                >
                    {section.question}
                </Text>
                {isActive ? <svg.QuestionCloseSvg /> : <svg.QuestionOpenSvg />}
            </View>
        );
    };

    const renderContent = (section: any, _: any, isActive: any) => {
        return (
            <View
                style={{
                    marginHorizontal: 20,
                    paddingBottom: 20,
                }}
            >
                <Text
                    style={{
                        ...theme.FONTS.Mulish_400Regular,
                        fontSize: 16,
                        lineHeight: 15 * 1.7,
                        // color: theme.COLORS.gray1,
                    }}
                >
                    {section.answer}
                </Text>
            </View>
        );
    };

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
                    sections={frequentlyQuestions}
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
