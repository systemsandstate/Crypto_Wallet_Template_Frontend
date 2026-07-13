import { View, Text, StyleSheet } from "react-native";
import React, { memo, useMemo } from "react";

import InputField, { type InputFieldHandle, type Props as InputFieldProps } from "./InputField";
import { useTheme } from "../hooks/useTheme";

type Props = InputFieldProps & {
    label: string;
    fieldStyle?: object;
};

const AuthLabeledField = memo(function AuthLabeledField({
    label,
    fieldStyle,
    containerStyle,
    ...inputProps
}: Props) {
    const { colors, FONTS } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    marginBottom: 14,
                },
                label: {
                    ...FONTS.Mulish_500Medium,
                    fontSize: 12,
                    color: colors.mainDark,
                    marginBottom: 6,
                    letterSpacing: 0.2,
                },
            }),
        [colors, FONTS]
    );

    return (
        <View style={[styles.wrap, fieldStyle]}>
            <Text style={styles.label}>{label}</Text>
            <InputField containerStyle={containerStyle} {...inputProps} />
        </View>
    );
});

export type { InputFieldHandle };
export default AuthLabeledField;
