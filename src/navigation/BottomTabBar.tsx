import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../constants";
import { svg } from "../svg";
import { useTranslation } from "../hooks/useTranslation";
import { TAB_BAR_CONTENT_HEIGHT } from "../hooks/useTabBarInset";

export { TAB_BAR_HEIGHT, useTabBarInset } from "../hooks/useTabBarInset";

export enum Tab {
    Dashboard = "Dashboard",
    History = "History",
    Analytics = "Analytics",
    Profile = "Profile",
}

const TAB_ICON_SIZE = 24;

const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 8);

    const labels: Record<Tab, string> = {
        [Tab.Dashboard]: t.tabs.home,
        [Tab.History]: t.tabs.history,
        [Tab.Analytics]: t.tabs.analytics,
        [Tab.Profile]: t.tabs.profile,
    };

    const renderIcon = (name: Tab, active: boolean) => {
        const color = active ? theme.COLORS.linkColor : theme.COLORS.bodyTextColor;
        switch (name) {
            case Tab.Dashboard:
                return <svg.ReportSvg color={color} />;
            case Tab.History:
                return <svg.WalletSvg color={color} />;
            case Tab.Analytics:
                return <svg.AnalyticsSvg color={color} />;
            case Tab.Profile:
                return <svg.UserOneSvg color={color} />;
            default:
                return null;
        }
    };

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
                    paddingBottom: bottomPadding,
                    paddingTop: 15,
                    minHeight: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
                }}
            >
                {state.routes.map((route, index) => {
                    const name = route.name as Tab;
                    const isFocused = state.index === index;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: "tabPress",
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            }}
                            style={{ alignItems: "center", minWidth: 56, flex: 1 }}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isFocused }}
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
                                {renderIcon(name, isFocused)}
                            </View>
                            <Text
                                style={{
                                    ...theme.FONTS.Mulish_600SemiBold,
                                    fontSize: 10,
                                    color: isFocused ? theme.COLORS.linkColor : theme.COLORS.mainDark,
                                }}
                            >
                                {labels[name]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default BottomTabBar;
