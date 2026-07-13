import { View, Text, TouchableOpacity, Platform, Pressable, StyleSheet } from "react-native";
import React, { useMemo, useState } from "react";

import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";
import { MENU_ICON_SIZE } from "../constants/menuIcon";

type Props = {
    onPress?: () => void;
    icon?: React.ReactElement;
    title?: string;
    titleStyle?: object;
    rightElement?: React.ReactElement;
    toggleButton?: boolean;
};

const ICON_SIZE = MENU_ICON_SIZE;

const ProfileCategory: React.FC<Props> = ({
    onPress,
    icon,
    title,
    titleStyle,
    rightElement,
    toggleButton,
}) => {
    const [toggle, setToggle] = useState(false);
    const { colors, FONTS } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                row: {
                    width: "100%",
                    minHeight: DENSITY.profileRowMinH,
                    marginBottom: 6,
                    borderRadius: 10,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: DENSITY.listRowPaddingH,
                    ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
                },
                rowPressed: {
                    backgroundColor: colors.rowPress,
                },
                iconSlot: {
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    alignItems: "center",
                    justifyContent: "center",
                },
                title: {
                    marginLeft: 12,
                    ...FONTS.Mulish_500Medium,
                    fontSize: 14,
                    color: colors.mainDark,
                },
                trailing: {
                    marginLeft: "auto",
                },
                toggle: {
                    width: 40,
                    marginLeft: "auto",
                    backgroundColor: toggle ? colors.green : colors.grey1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: toggle ? "flex-end" : "flex-start",
                    padding: 2,
                    borderRadius: 20,
                },
                toggleKnob: {
                    width: 20,
                    height: 20,
                    borderRadius: 12,
                    backgroundColor: "#FFFFFF",
                },
            }),
        [FONTS, colors, toggle]
    );

    const content = (
        <>
            {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
            <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                {title}
            </Text>
            {rightElement ? <View style={styles.trailing}>{rightElement}</View> : null}
            {toggleButton ? (
                <TouchableOpacity
                    style={styles.toggle}
                    onPress={() => setToggle(!toggle)}
                    activeOpacity={0.8}
                >
                    <View style={styles.toggleKnob} />
                </TouchableOpacity>
            ) : null}
        </>
    );

    if (Platform.OS === "web") {
        return (
            <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={onPress}
                accessibilityRole="button"
            >
                {content}
            </Pressable>
        );
    }

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityRole="button"
        >
            {content}
        </TouchableOpacity>
    );
};

export default ProfileCategory;
