import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "../constants";

type Props = {
    containerStyle?: any;
    onPress?: () => void;
    title?: string;
    leading?: React.ReactNode;
};

const Button: React.FC<Props> = ({ title, onPress, containerStyle, leading }) => {
    return (
        <View style={{ ...containerStyle, width: "100%" }}>
            <TouchableOpacity onPress={onPress}>
                <LinearGradient
                    colors={["#96D9FE", "#1D5DA2"]}
                    style={{
                        width: "100%",
                        height: 50,
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 10,
                        flexDirection: "row",
                        gap: 10,
                    }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    {leading}
                    <Text
                        style={{
                            color: theme.COLORS.white,
                            ...theme.FONTS.Mulish_600SemiBold,
                            fontSize: 16,
                        }}
                    >
                        {title}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

export default Button;
