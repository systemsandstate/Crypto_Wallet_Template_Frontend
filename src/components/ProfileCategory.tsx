import { View, Text, TouchableOpacity, Platform, Pressable, StyleSheet } from "react-native";
import React, { useMemo, useState } from "react";
import { Shadow } from "react-native-shadow-2";

import { useTheme } from "../hooks/useTheme";
import { MENU_ICON_SIZE } from "../constants/menuIcon";

type Props = {
    onPress?: () => void;
    icon?: React.ReactElement;
    title?: string;
    titleStyle?: object;
    rightElement?: React.ReactElement;
    toggleButton?: boolean;
};

const ICON_SIZE = MENU_ICON_SIZE;

const ProfileCategory: React.FC<Props> = ({
    onPress,
    icon,
    title,
    titleStyle,
    rightElement,
    toggleButton,
}) => {
    const [toggle, setToggle] = useState(false);
    const { colors, FONTS } = useTheme();

    const rowStyle = {
        flex: 1,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingHorizontal: 20,
        ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
    };

    const RowButton = Platform.OS === "web" ? Pressable : TouchableOpacity;

    const shadowStart = useMemo(
        () => (colors.bgColor === "#0E0E13" ? "rgba(0, 0, 0, 0.35)" : "rgba(6, 38, 100, 0.02)"),
        [colors.bgColor]
    );

    return (
        <View style={{ width: "100%", height: 62, marginBottom: 6 }}>
            <Shadow
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: colors.white,
                }}
                containerStyle={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: colors.white,
                }}
                offset={[0, 0]}
                distance={15}
                startColor={shadowStart}
                endColor={"rgba(6, 38, 100, 0.0)"}
            >
                <RowButton
                    style={rowStyle}
                    onPress={onPress}
                    accessibilityRole="button"
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
                        <Text
                            style={{
                                marginLeft: 10,
                                ...FONTS.H5,
                                color: colors.mainDark,
                                ...titleStyle,
                            }}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                    </View>
                    {rightElement && (
                        <View style={{ marginLeft: "auto" }}>
                            {rightElement}
                        </View>
                    )}
                    {toggleButton && (
                        <TouchableOpacity
                            style={{
                                width: 40,
                                marginLeft: "auto",
                                backgroundColor: toggle ? colors.green : colors.grey1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: toggle ? "flex-end" : "flex-start",
                                padding: 2,
                                borderRadius: 20,
                            }}
                            onPress={() => setToggle(!toggle)}
                            activeOpacity={0.8}
                        >
                            <View
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 12,
                                    backgroundColor: "#FFFFFF",
                                }}
                            />
                        </TouchableOpacity>
                    )}
                </RowButton>
            </Shadow>
        </View>
    );
};

const styles = StyleSheet.create({
    iconSlot: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default ProfileCategory;
