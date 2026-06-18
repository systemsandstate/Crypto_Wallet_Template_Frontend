import {
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    View,
    StyleSheet,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import ParsedText from "react-native-parsed-text";

import { components } from "../components";
import { theme } from "../constants";

const MobilePayment: React.FC = () => {
    let pattern = /(\d{3})\d{4}(\d{4})/g;

    const renderHeader = () => {
        return <components.Header title="Mobile payment" goBack={true} />;
    };

    const renderContent = () => {
        return (
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
            >
                <components.InputField
                    placeholder="+17 | xxxxxxxxxx"
                    containerStyle={{ marginBottom: 14, marginTop: 20 }}
                    leftIcon={
                        <Image
                            source={require("../assets/flags/01.png")}
                            style={{ width: 20.59, height: 14, marginRight: 6 }}
                        />
                    }
                />
                <components.SmallHeader
                    title="Your balance: 4 863.27 USD"
                    containerStyle={{ marginBottom: 6 }}
                />
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                        style={{
                            backgroundColor: theme.COLORS.white,
                            paddingHorizontal: 20,
                            paddingVertical: 14,
                            borderRadius: 10,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Text
                            style={{
                                ...theme.FONTS.Mulish_500Medium,
                                color: theme.COLORS.mainDark,
                                fontSize: 28,
                            }}
                        >
                            $10.00
                        </Text>
                    </View>
                    <Text
                        style={{
                            ...theme.FONTS.Mulish_400Regular,
                            color: theme.COLORS.bodyTextColor,
                            marginLeft: 14,
                            fontSize: 12,
                        }}
                    >
                        No fees
                    </Text>
                </View>
                <components.Button
                    title="Confirm"
                    containerStyle={{ marginTop: theme.SIZES.height * 0.1 }}
                />
            </ScrollView>
        );
    };

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}
        >
            {renderHeader()}
            {renderContent()}
        </SafeAreaView>
    );
};

export default MobilePayment;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5FCFF",
    },

    url: {
        color: "green",
        textDecorationLine: "underline",
    },

    email: {
        textDecorationLine: "underline",
    },

    text: {
        color: "black",
        fontSize: 15,
    },

    phone: {
        color: "blue",
        textDecorationLine: "underline",
    },

    name: {
        color: "red",
    },

    username: {
        color: "green",
        fontWeight: "bold",
    },

    magicNumber: {
        fontSize: 42,
        color: "pink",
    },

    hashTag: {
        fontStyle: "italic",
    },
});
