import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { svg } from "../svg";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { TAB_BAR_CONTENT_HEIGHT } from "../hooks/useTabBarInset";
import { MENU_ICON_SIZE } from "../constants/menuIcon";

export { TAB_BAR_HEIGHT, useTabBarInset } from "../hooks/useTabBarInset";

export enum Tab {
    Dashboard = "Dashboard",
    History = "History",
    Analytics = "Analytics",
    Profile = "Profile",
}

const TAB_ICON_SIZE = MENU_ICON_SIZE;

const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 8);

    const labels: Record<Tab, string> = {
        [Tab.Dashboard]: t.tabs.home,
        [Tab.History]: t.tabs.history,
        [Tab.Analytics]: t.tabs.analytics,
        [Tab.Profile]: t.tabs.profile,
    };

    const renderIcon = (name: Tab, active: boolean) => {
        const color = active ? colors.linkColor : colors.bodyTextColor;
        switch (name) {
            case Tab.Dashboard:
                return <svg.HomeSvg color={color} size={TAB_ICON_SIZE} />;
            case Tab.History:
                return <svg.HistorySvg color={color} size={TAB_ICON_SIZE} />;
            case Tab.Analytics:
                return <svg.AnalyticsSvg color={color} size={TAB_ICON_SIZE} />;
            case Tab.Profile:
                return <svg.ProfileTabSvg color={color} size={TAB_ICON_SIZE} />;
            default:
                return null;
        }
    };

    return (
        <View
            style={{
                backgroundColor: colors.white,
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
                                    ...FONTS.Mulish_600SemiBold,
                                    fontSize: 10,
                                    color: isFocused ? colors.linkColor : colors.mainDark,
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
