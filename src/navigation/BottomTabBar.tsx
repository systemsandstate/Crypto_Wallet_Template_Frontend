import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { setScreen } from "../store/tabSlice";
import { theme } from "../constants";
import { svg } from "../svg";
import { RootState } from "../store/store";

export const TAB_BAR_HEIGHT = 82;

export enum Tab {
    Dashboard = "Dashboard",
    History = "History",
    Analytics = "Analytics",
    Profile = "Profile",
}

const TAB_ICON_SIZE = 24;

const BottomTabBar: React.FC = () => {
    const dispatch = useDispatch();
    const currentScreen = useSelector((state: RootState) => state.tab.screen);

    const tabs = [
        {
            name: Tab.Dashboard,
            label: "Home",
            icon: (
                <svg.ReportSvg
                    color={
                        currentScreen === Tab.Dashboard
                            ? theme.COLORS.linkColor
                            : theme.COLORS.bodyTextColor
                    }
                />
            ),
        },
        {
            name: Tab.History,
            label: "History",
            icon: (
                <svg.WalletSvg
                    color={
                        currentScreen === Tab.History
                            ? theme.COLORS.linkColor
                            : theme.COLORS.bodyTextColor
                    }
                />
            ),
        },
        {
            name: Tab.Analytics,
            label: "Analytics",
            icon: (
                <svg.AnalyticsSvg
                    color={
                        currentScreen === Tab.Analytics
                            ? theme.COLORS.linkColor
                            : theme.COLORS.bodyTextColor
                    }
                />
            ),
        },
        {
            name: Tab.Profile,
            label: "Profile",
            icon: (
                <svg.UserOneSvg
                    color={
                        currentScreen === Tab.Profile
                            ? theme.COLORS.linkColor
                            : theme.COLORS.bodyTextColor
                    }
                />
            ),
        },
    ];

    return (
        <View
            style={{
                backgroundColor: theme.COLORS.white,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    paddingHorizontal: 12,
                    paddingBottom: 28,
                    paddingTop: 15,
                    minHeight: TAB_BAR_HEIGHT,
                }}
            >
                {tabs.map((item) => (
                    <TouchableOpacity
                        key={item.name}
                        onPress={() => dispatch(setScreen(item.name))}
                        style={{ alignItems: "center", minWidth: 56, flex: 1 }}
                    >
                        <View
                            style={{
                                width: TAB_ICON_SIZE,
                                height: TAB_ICON_SIZE,
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 6,
                            }}
                        >
                            {item.icon}
                        </View>
                        <Text
                            style={{
                                ...theme.FONTS.Mulish_600SemiBold,
                                fontSize: 10,
                                color:
                                    item.name === currentScreen
                                        ? theme.COLORS.linkColor
                                        : theme.COLORS.mainDark,
                            }}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default BottomTabBar;
