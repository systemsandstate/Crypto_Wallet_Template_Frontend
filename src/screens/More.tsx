import {
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    ImageBackground,
    Text,
    FlatList,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Shadow } from "react-native-shadow-2";
import { useNavigation } from "@react-navigation/native";

import { svg } from "../svg";
import { theme } from "../constants";
import { components } from "../components";

const categories = [
    {
        id: "1",
        title: "Add new card",
        icon: require("../assets/icons/01.png"),
    },
    {
        id: "2",
        title: "Create invoice",
        icon: require("../assets/icons/02.png"),
    },
    {
        id: "3",
        title: "Statistics",
        icon: require("../assets/icons/03.png"),
    },
    {
        id: "4",
        title: "Scanner QR",
        icon: require("../assets/icons/04.png"),
    },
    {
        id: "5",
        title: "FAQ",
        icon: require("../assets/icons/05.png"),
    },
    {
        id: "6",
        title: "Support",
        icon: require("../assets/icons/06.png"),
    },
    {
        id: "7",
        title: "Charity",
        icon: require("../assets/icons/07.png"),
    },
    {
        id: "8",
        title: "Privacy policy",
        icon: require("../assets/icons/08.png"),
    },
];

const More: React.FC = () => {
    const navigation: any = useNavigation();

    const renderBackground = () => {
        return (
            <Image
                source={require("../assets/bg/04.png")}
                style={{
                    width: "100%",
                    height: 530,
                    position: "absolute",
                }}
            />
        );
    };

    const renderContent = () => {
        return (
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 20,
                }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <Text
                    style={{
                        marginTop: 64,
                        ...theme.FONTS.H2,
                        color: theme.COLORS.mainDark,
                        marginBottom: 20,
                    }}
                >
                    More
                </Text>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        marginBottom: 20,
                    }}
                >
                    {categories.map((item, index) => {
                        return (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    width: "48%",
                                    height: 130,
                                    marginBottom: 14,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    backgroundColor: theme.COLORS.white,
                                    borderRadius: 10,
                                }}
                                activeOpacity={0.8}
                                onPress={() =>
                                    item.title === "Add new card"
                                        ? navigation.navigate("OpenNewCard")
                                        : item.title === "Create invoice"
                                        ? navigation.navigate("CreateInvoice")
                                        : item.title === "Statistics"
                                        ? navigation.navigate("Statistics")
                                        : item.title === "Scanner QR"
                                        ? console.log("Scanner QR")
                                        : item.title === "FAQ"
                                        ? navigation.navigate("FAQ")
                                        : item.title === "Support"
                                        ? console.log("Open support")
                                        : item.title === "Charity"
                                        ? navigation.navigate("Payments")
                                        : item.title === "Privacy policy"
                                        ? navigation.navigate("PrivacyPolicy")
                                        : null
                                }
                            >
                                <Image
                                    source={item.icon}
                                    style={{
                                        width: 50,
                                        height: 50,
                                        marginBottom: 12,
                                    }}
                                />
                                <Text
                                    style={{
                                        ...theme.FONTS.H5,
                                        color: theme.COLORS.mainDark,
                                    }}
                                >
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            {renderBackground()}
            <View style={{ flex: 1 }}>{renderContent()}</View>
        </View>
    );
};

export default More;
