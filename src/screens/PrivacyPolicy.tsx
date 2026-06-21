import { View, ScrollView, Image, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";
import { components } from "../components";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";

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
    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <View style={{ height: 179 }}>
                <SafeAreaView>
                    <components.Header goBack={true} containerStyle={{ marginBottom: 20 }} />
                    <View style={{ paddingHorizontal: 20 }}>
                        <Text style={{ ...theme.FONTS.H2, color: theme.COLORS.mainDark }}>
                            Privacy policy
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
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: TAB_BAR_HEIGHT + 24 }}>
                <Text style={headingStyle}>1. Overview</Text>
                <Text style={bodyStyle}>
                    Merchant Payments ("the App") helps merchants create USDT payment requests and
                    track payment status. We do not hold customer funds. Payments are processed by
                    OxaPay; we store invoice metadata and confirmation records for your business.
                </Text>
                <Text style={headingStyle}>2. Data we collect</Text>
                <Text style={bodyStyle}>
                    Account data: business name, email, phone (optional), and password (stored hashed).{"\n"}
                    Payment data: amount, currency, reference, status, transaction hash, and OxaPay
                    invoice identifiers.{"\n"}
                    Technical data: login timestamps and webhook audit logs for payment reconciliation.
                </Text>
                <Text style={headingStyle}>3. How we use data</Text>
                <Text style={bodyStyle}>
                    We use your data to authenticate you, create payment requests, display payment
                    history, send password-reset emails when configured, and reconcile payments via
                    OxaPay webhooks. We do not sell your personal information.
                </Text>
                <Text style={headingStyle}>4. Third parties</Text>
                <Text style={bodyStyle}>
                    OxaPay processes cryptocurrency payments. Their privacy policy applies to payment
                    flows initiated from the App. Hosting and infrastructure providers may process
                    server logs necessary to operate the service.
                </Text>
                <Text style={headingStyle}>5. Retention & security</Text>
                <Text style={bodyStyle}>
                    Payment records are retained for merchant accounting and dispute resolution.
                    Passwords are hashed. API access uses signed tokens with expiry. Contact your
                    account administrator to request account deletion.
                </Text>
                <Text style={headingStyle}>6. Contact</Text>
                <Text style={bodyStyle}>
                    For privacy questions regarding Merchant Payments, contact the merchant account
                    owner or platform administrator listed in your onboarding materials.
                </Text>
            </ScrollView>
        </View>
    );
};

export default PrivacyPolicy;
