import { View } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useEffect } from "react";

import { useTheme } from "../hooks/useTheme";

type TabName = "Dashboard" | "History" | "Analytics" | "Profile";

const MerchantTabRedirect: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const tab: TabName = route.params?.tab || "Dashboard";
    const { colors } = useTheme();

    useEffect(() => {
        navigation.replace("TabNavigator", { screen: tab });
    }, [navigation, tab]);

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: colors.bgColor,
            }}
        >
            <LoadingSpinner size={48} />
        </View>
    );
};

export default MerchantTabRedirect;
