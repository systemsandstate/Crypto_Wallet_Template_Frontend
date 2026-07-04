import React from "react";
import {
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

import { useTabBarInset } from "../hooks/useTabBarInset";
import { useTheme } from "../hooks/useTheme";

type Props = ScrollViewProps & {
    children: React.ReactNode;
    withTabBarInset?: boolean;
    contentStyle?: ViewStyle;
};

const ScreenScroll: React.FC<Props> = ({
    children,
    withTabBarInset = true,
    contentContainerStyle,
    contentStyle,
    style,
    ...scrollProps
}) => {
    const bottomInset = useTabBarInset();
    const { colors } = useTheme();

    return (
        <ScrollView
            style={[styles.scroll, { backgroundColor: colors.bgColor }, style]}
            contentContainerStyle={[
                styles.content,
                withTabBarInset ? { paddingBottom: bottomInset } : null,
                contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            {...scrollProps}
        >
            <View style={[styles.inner, contentStyle]}>{children}</View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        alignItems: "center",
    },
    inner: {
        width: "100%",
    },
});

export default ScreenScroll;
