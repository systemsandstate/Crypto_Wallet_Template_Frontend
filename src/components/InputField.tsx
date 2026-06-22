import { View, Text, TextInput, Platform, StyleSheet } from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";

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
    /** Shown below the field; use for long hints instead of truncating the placeholder. */
    hint?: string;
};

const BORDER_IDLE = "#E2E8F0";
const IS_WEB = Platform.OS === "web";

/**
 * On native, keep text in local state so parent screens do not re-render on
 * every keystroke (avoids Android / Expo Go input crashes).
 */
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
    hint,
}) => {
    const isEmail = keyboardType === "email-address";
    const nativeKeyboardType =
        Platform.OS === "android" && isEmail ? undefined : keyboardType;

    const focusedRef = useRef(false);
    const notifyFrameRef = useRef<number | null>(null);
    const [nativeText, setNativeText] = useState(value ?? "");

    useEffect(() => {
        if (IS_WEB || focusedRef.current) return;
        if (value !== undefined && value !== nativeText) {
            setNativeText(value);
        }
    }, [value, nativeText]);

    const notifyParent = useCallback(
        (text: string) => {
            if (!onChangeText) return;
            if (IS_WEB) {
                onChangeText(text);
                return;
            }
            if (notifyFrameRef.current !== null) {
                cancelAnimationFrame(notifyFrameRef.current);
            }
            notifyFrameRef.current = requestAnimationFrame(() => {
                notifyFrameRef.current = null;
                onChangeText(text);
            });
        },
        [onChangeText]
    );

    const handleChange = useCallback(
        (text: string) => {
            if (!IS_WEB) setNativeText(text);
            notifyParent(text);
        },
        [notifyParent]
    );

    const handleFocus = useCallback(() => {
        focusedRef.current = true;
    }, []);

    const handleBlur = useCallback(() => {
        focusedRef.current = false;
        if (!IS_WEB && value !== undefined && value !== nativeText) {
            setNativeText(value);
        }
    }, [nativeText, value]);

    useEffect(() => {
        return () => {
            if (notifyFrameRef.current !== null) {
                cancelAnimationFrame(notifyFrameRef.current);
            }
        };
    }, []);

    const displayValue = IS_WEB ? value : nativeText;

    const field = (
        <View style={[styles.container, !hint && containerStyle]}>
            {leftIcon && leftIcon}
            <TextInput
                placeholder={placeholder}
                value={displayValue}
                onChangeText={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoCapitalize={autoCapitalize ?? (isEmail ? "none" : undefined)}
                autoCorrect={false}
                spellCheck={false}
                style={[styles.input, IS_WEB && styles.inputWeb]}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#868698"
                keyboardType={nativeKeyboardType}
                underlineColorAndroid="transparent"
                {...(Platform.OS === "android"
                    ? {
                          importantForAutofill: "no" as const,
                          autoComplete: "off" as const,
                      }
                    : IS_WEB
                      ? {
                            ...(isEmail ? { autoComplete: "email" as const } : {}),
                            outlineStyle: "none",
                            outlineWidth: 0,
                        }
                      : {})}
            />
            {rightIcon && rightIcon}
        </View>
    );

    if (hint) {
        return (
            <View collapsable={false} style={containerStyle}>
                {field}
                <Text style={styles.hint}>{hint}</Text>
            </View>
        );
    }

    return field;
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        width: "100%",
        backgroundColor: theme.COLORS.white,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER_IDLE,
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.COLORS.mainDark,
        backgroundColor: "transparent",
        padding: 0,
        margin: 0,
        ...(Platform.OS === "android" ? { textAlignVertical: "center" as const } : {}),
    },
    inputWeb: {
        borderWidth: 0,
        outlineWidth: 0,
        boxShadow: "none",
        ...theme.FONTS.Mulish_400Regular,
    } as object,
    hint: {
        ...theme.FONTS.Mulish_400Regular,
        fontSize: 12,
        lineHeight: 12 * 1.5,
        color: theme.COLORS.bodyTextColor,
        marginTop: 6,
    },
});

export default memo(InputField);
