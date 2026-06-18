import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Shadow } from "react-native-shadow-2";
import { theme } from "../constants";

type Props = {
    onPress?: () => void;
    icon?: JSX.Element;
    title?: string;
    rightElement?: JSX.Element;
    toggleButton?: boolean;
};

const ProfileCategory: React.FC<Props> = ({
    onPress,
    icon,
    title,
    rightElement,
    toggleButton,
}) => {
    const [toggle, setToggle] = useState(false);

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
                <TouchableOpacity
                    style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 20,
                    }}
                    onPress={onPress}
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
                </TouchableOpacity>
            </Shadow>
        </View>
    );
};

export default ProfileCategory;
