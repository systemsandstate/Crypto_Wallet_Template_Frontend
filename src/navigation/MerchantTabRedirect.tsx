import { View, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import { theme } from "../constants";
import { setScreen } from "../store/tabSlice";

type TabName = "Dashboard" | "History" | "Analytics" | "Profile";

const MerchantTabRedirect: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const tab: TabName = route.params?.tab || "Dashboard";

    useEffect(() => {
        dispatch(setScreen(tab));
        navigation.replace("TabNavigator");
    }, [dispatch, navigation, tab]);

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
