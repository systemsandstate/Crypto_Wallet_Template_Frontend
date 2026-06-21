import { View, TextInput, Platform, StyleSheet } from "react-native";
import React, { useState } from "react";

import { theme } from "../constants";

export type Props = {
    placeholder: string;
    value?: string;
    onChangeText?: (text: string) => void;
    secureTextEntry?: boolean;
    icon?: any;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    containerStyle?: any;
    leftIcon?: React.ReactElement;
    rightIcon?: React.ReactElement;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

const BORDER_IDLE = "#E2E8F0";

const InputField: React.FC<Props> = ({
    placeholder,
    value,
    onChangeText,
    containerStyle,
    secureTextEntry,
    keyboardType,
    leftIcon,
    rightIcon,
    autoCapitalize,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View
            style={[
                styles.container,
                {
                    borderColor: isFocused ? theme.COLORS.mainDark : BORDER_IDLE,
                },
                containerStyle,
            ]}
        >
            {leftIcon && leftIcon}
            <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize={autoCapitalize}
                style={[styles.input, Platform.OS === "web" && styles.inputWeb]}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#868698"
                keyboardType={keyboardType}
                numberOfLines={1}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...(Platform.OS === "web"
                    ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                    : {})}
            />
            {rightIcon && rightIcon}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        width: "100%",
        backgroundColor: theme.COLORS.white,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
    },
    input: {
        flex: 1,
        height: "100%",
        width: "100%",
        fontSize: 14,
        lineHeight: 16,
        color: theme.COLORS.mainDark,
        ...theme.FONTS.Mulish_400Regular,
        backgroundColor: "transparent",
    },
    inputWeb: {
        borderWidth: 0,
        outlineWidth: 0,
        boxShadow: "none",
    } as object,
});

export default InputField;
