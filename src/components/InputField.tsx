import { View, Text, TextInput, Platform, StyleSheet } from "react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTheme } from "../hooks/useTheme";

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
    /** Keep long values (e.g. wallet addresses) on one horizontal scroll line. */
    singleLine?: boolean;
    /** Native/DOM input ref — used on web to read autofilled values on submit. */
    inputRef?: React.Ref<TextInput>;
};

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
    singleLine = false,
    inputRef,
}) => {
    const { colors, FONTS } = useTheme();
    const isEmail = keyboardType === "email-address";
    const nativeKeyboardType =
        Platform.OS === "android" && isEmail ? undefined : keyboardType;

    const focusedRef = useRef(false);
    const notifyFrameRef = useRef<number | null>(null);
    const [nativeText, setNativeText] = useState(value ?? "");

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    height: 50,
                    width: "100%",
                    backgroundColor: colors.white,
                    paddingHorizontal: IS_WEB ? 0 : 20,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    flexDirection: "row",
                    alignItems: "center",
                    overflow: "hidden",
                },
                input: {
                    flex: 1,
                    minWidth: 0,
                    fontSize: 16,
                    color: colors.mainDark,
                    backgroundColor: "transparent",
                    padding: 0,
                    margin: 0,
                    ...(Platform.OS === "android" ? { textAlignVertical: "center" as const } : {}),
                    ...(IS_WEB
                        ? {
                              paddingHorizontal: 16,
                              paddingVertical: 12,
                              height: "100%" as unknown as number,
                          }
                        : {}),
                },
                inputWeb: {
                    borderWidth: 0,
                    outlineWidth: 0,
                    outlineStyle: "none",
                    boxShadow: "none",
                    backgroundColor: "transparent",
                    ...FONTS.Mulish_400Regular,
                } as object,
                inputSingleLine: {
                    fontSize: 14,
                },
                inputWebSingleLine: {
                    whiteSpace: "nowrap",
                    overflowX: "auto",
                } as object,
                hint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    lineHeight: 12 * 1.5,
                    color: colors.bodyTextColor,
                    marginTop: 6,
                },
                iconLeft: {
                    marginLeft: IS_WEB ? 16 : 0,
                    marginRight: 8,
                },
                iconRight: {
                    marginRight: IS_WEB ? 16 : 0,
                    marginLeft: 8,
                },
            }),
        [colors, FONTS]
    );

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
    const isPassword = Boolean(secureTextEntry);

    const field = (
        <View
            style={[styles.container, !hint && containerStyle]}
            {...(IS_WEB ? ({ dataSet: { mpInputShell: "true" } } as object) : {})}
        >
            {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
            <TextInput
                ref={inputRef}
                placeholder={placeholder}
                value={displayValue}
                onChangeText={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoCapitalize={autoCapitalize ?? (isEmail ? "none" : undefined)}
                autoCorrect={false}
                spellCheck={false}
                style={[
                    styles.input,
                    singleLine && styles.inputSingleLine,
                    IS_WEB && styles.inputWeb,
                    IS_WEB && singleLine && styles.inputWebSingleLine,
                ]}
                secureTextEntry={secureTextEntry}
                placeholderTextColor={colors.placeholder}
                keyboardType={nativeKeyboardType}
                underlineColorAndroid="transparent"
                multiline={!singleLine && !isPassword}
                numberOfLines={singleLine || isPassword ? 1 : undefined}
                scrollEnabled={singleLine}
                textContentType={isPassword ? "password" : isEmail ? "emailAddress" : undefined}
                {...(Platform.OS === "android"
                    ? {
                          importantForAutofill: "no" as const,
                          autoComplete: isPassword ? ("password" as const) : ("off" as const),
                      }
                    : IS_WEB
                      ? {
                            ...(isEmail ? { autoComplete: "email" as const } : {}),
                            ...(isPassword
                                ? {
                                      type: "password" as const,
                                      autoComplete: "current-password" as const,
                                  }
                                : {}),
                            outlineStyle: "none",
                            outlineWidth: 0,
                        }
                      : {})}
            />
            {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
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

export default memo(InputField);
