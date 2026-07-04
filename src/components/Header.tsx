import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import React, { memo, useCallback, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

import { svg } from "../svg";
import { useTheme } from "../hooks/useTheme";
import { navigateUp } from "../navigation/navigateUp";

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
    onGoBack?: () => void;
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
    onGoBack,
}) => {
    const navigation: any = useNavigation();
    const route = useRoute();
    const { colors, FONTS } = useTheme();

    const handleGoBack = useCallback(() => {
        if (onGoBack) {
            onGoBack();
            return;
        }
        navigateUp(navigation, route.name, route.params as Record<string, unknown>);
    }, [navigation, onGoBack, route.name, route.params]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                bar: {
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 47,
                    position: "relative",
                },
                barBorder: {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
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
                    ...FONTS.H4,
                    color: colors.mainDark,
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
                    color: colors.mainDark,
                },
                fileSlot: {
                    position: "absolute",
                    right: 0,
                    height: "100%",
                    justifyContent: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 6,
                },
            }),
        [colors, FONTS]
    );

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
                        onPress={handleGoBack}
                    >
                        <svg.GoBackSvg goBackColor={goBackColor ?? colors.mainDark} />
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
                    <svg.FileTextSvg color={colors.mainDark} />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default memo(Header);
