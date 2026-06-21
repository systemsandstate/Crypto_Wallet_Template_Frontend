import { View, Text, TouchableOpacity, Platform, Pressable } from "react-native";
import React, { useState } from "react";
import { Shadow } from "react-native-shadow-2";
import { theme } from "../constants";

type Props = {
    onPress?: () => void;
    icon?: React.ReactElement;
    title?: string;
    titleStyle?: object;
    rightElement?: React.ReactElement;
    toggleButton?: boolean;
};

const ProfileCategory: React.FC<Props> = ({
    onPress,
    icon,
    title,
    titleStyle,
    rightElement,
    toggleButton,
}) => {
    const [toggle, setToggle] = useState(false);

    const rowStyle = {
        flex: 1,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingHorizontal: 20,
        ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
    };

    const RowButton = Platform.OS === "web" ? Pressable : TouchableOpacity;

    return (
        <View style={{ width: "100%", height: 62, marginBottom: 6 }}>
            <Shadow
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: "white",
                }}
                containerStyle={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: "white",
                }}
                offset={[0, 0]}
                distance={15}
                startColor={"rgba(6, 38, 100, 0.02)"}
                endColor={"rgba(6, 38, 100, 0.0)"}
            >
                <RowButton
                    style={rowStyle}
                    onPress={onPress}
                    accessibilityRole="button"
                >
                    <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                    >
                        {icon && icon}
                        <Text
                            style={{
                                marginLeft: 10,
                                ...theme.FONTS.H5,
                                color: theme.COLORS.mainDark,
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
                                backgroundColor: toggle
                                    ? theme.COLORS.green
                                    : theme.COLORS.grey1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: toggle
                                    ? "flex-end"
                                    : "flex-start",
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
                                    backgroundColor: theme.COLORS.white,
                                }}
                            />
                        </TouchableOpacity>
                    )}
                </RowButton>
            </Shadow>
        </View>
    );
};

export default ProfileCategory;
