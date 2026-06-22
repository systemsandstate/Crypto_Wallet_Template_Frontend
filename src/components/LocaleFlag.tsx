import { View, StyleSheet } from "react-native";
import React from "react";

import type { AppLocale } from "../i18n";
import SpainFlagSvg from "../svg/SpainFlagSvg";
import UkFlagSvg from "../svg/UkFlagSvg";

type Props = {
    locale: AppLocale;
    size?: number;
};

const FLAG_ASPECT = 2 / 3;

const LocaleFlag: React.FC<Props> = ({ locale, size = 22 }) => {
    const width = size;
    const height = Math.round(size / FLAG_ASPECT);

    return (
        <View style={[styles.wrap, { width, height, borderRadius: Math.max(2, size * 0.1) }]}>
            {locale === "es" ? (
                <SpainFlagSvg width={width} height={height} />
            ) : (
                <UkFlagSvg width={width} height={height} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        overflow: "hidden",
    },
});

export default LocaleFlag;
