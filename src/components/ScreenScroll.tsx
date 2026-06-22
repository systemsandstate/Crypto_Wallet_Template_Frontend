import React from "react";
import {
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

import { theme } from "../constants";
import { useTabBarInset } from "../hooks/useTabBarInset";

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

    return (
        <ScrollView
            style={[styles.scroll, style]}
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
        backgroundColor: theme.COLORS.bgColor,
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
