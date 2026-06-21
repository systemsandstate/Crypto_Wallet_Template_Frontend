import { View } from "react-native";
import React from "react";
import { useSelector } from "react-redux";

import { theme } from "../constants";
import { RootState } from "../store/store";
import BottomTabBar, { Tab } from "./BottomTabBar";
import { HomeStackNavigator, HistoryStackNavigator, AnalyticsStackNavigator, ProfileStackNavigator } from "./MerchantStacks";

const TabNavigator = () => {
    const currentScreen = useSelector((state: RootState) => state.tab.screen);

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <View style={{ flex: 1 }}>
                {currentScreen === Tab.Dashboard && <HomeStackNavigator />}
                {currentScreen === Tab.History && <HistoryStackNavigator />}
                {currentScreen === Tab.Analytics && <AnalyticsStackNavigator />}
                {currentScreen === Tab.Profile && <ProfileStackNavigator />}
            </View>
            <BottomTabBar />
        </View>
    );
};

export default TabNavigator;
