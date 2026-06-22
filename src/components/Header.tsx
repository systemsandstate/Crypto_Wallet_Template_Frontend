import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from "react-native";
import React, { memo } from "react";
import { useNavigation } from "@react-navigation/native";

import { svg } from "../svg";
import { theme } from "../constants";
import LanguageTrigger from "./LanguageTrigger";
import type { LanguageSwitcherTone } from "../context/LanguageSwitcherToneContext";

type Props = {
    containerStyle?: object;
    goBack?: boolean;
    burgerMenu?: boolean;
    title?: string;
    logo?: boolean;
    search?: boolean;
    bag?: boolean;
    border?: boolean;
    titleStyle?: object;
    arrowColor?: string;
    fileIcon?: boolean;
    goBackColor?: string;
    showLanguage?: boolean;
    languageTone?: LanguageSwitcherTone;
};

const Header: React.FC<Props> = ({
    containerStyle,
    goBack,
    title,
    search,
    border,
    titleStyle,
    fileIcon,
    goBackColor,
    showLanguage = true,
    languageTone = "on-light",
}) => {
    const navigation: any = useNavigation();

    return (
        <View
            style={[
                styles.bar,
                border ? styles.barBorder : null,
                containerStyle,
            ]}
        >
            {goBack && (
                <View style={styles.backSlot}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <svg.GoBackSvg goBackColor={goBackColor} />
                    </TouchableOpacity>
                </View>
            )}
            {title ? (
                <Text style={[styles.title, titleStyle]}>{title}</Text>
            ) : null}
            {search && (
                <View style={styles.searchRow}>
                    <TextInput placeholder="Search" style={styles.searchInput} />
                </View>
            )}
            {fileIcon && (
                <TouchableOpacity style={styles.fileSlot}>
                    <svg.FileTextSvg color={theme.COLORS.white} />
                </TouchableOpacity>
            )}
            {showLanguage ? (
                <View style={styles.languageSlot}>
                    <LanguageTrigger tone={languageTone} />
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: 47,
        position: "relative",
    },
    barBorder: {
        borderBottomWidth: 1,
    },
    backSlot: {
        position: "absolute",
        left: 0,
        alignItems: "center",
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    title: {
        textAlign: "center",
        ...theme.FONTS.H4,
        color: theme.COLORS.mainDark,
    },
    searchRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 72,
    },
    searchInput: {
        height: "100%",
        width: "100%",
    },
    fileSlot: {
        position: "absolute",
        right: 0,
        height: "100%",
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingVertical: 6,
    },
    languageSlot: {
        position: "absolute",
        right: 8,
        top: 0,
        bottom: 0,
        justifyContent: "center",
    },
});

export default memo(Header);
