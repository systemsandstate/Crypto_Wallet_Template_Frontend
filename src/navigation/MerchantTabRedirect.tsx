import { View, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";

import { theme } from "../constants";

type TabName = "Dashboard" | "History" | "Analytics" | "Profile";

const MerchantTabRedirect: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const tab: TabName = route.params?.tab || "Dashboard";

    useEffect(() => {
        navigation.replace("TabNavigator", { screen: tab });
    }, [navigation, tab]);

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.COLORS.bgColor,
            }}
        >
            <ActivityIndicator size="large" color={theme.COLORS.mainDark} />
        </View>
    );
};

export default MerchantTabRedirect;
