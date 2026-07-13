import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    View,
} from "react-native";

import { useTabBarInset } from "../hooks/useTabBarInset";

type Props = ScrollViewProps & {
    children: React.ReactNode;
    keyboardVerticalOffset?: number;
    withTabBarInset?: boolean;
};

const FormScrollView: React.FC<Props> = ({
    children,
    keyboardVerticalOffset = Platform.OS === "ios" ? 72 : 0,
    withTabBarInset = false,
    contentContainerStyle,
    ...scrollProps
}) => {
    const tabBarInset = useTabBarInset(withTabBarInset ? 8 : 0);

    const scroll = (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
                styles.content,
                withTabBarInset ? { paddingBottom: tabBarInset } : null,
                contentContainerStyle,
            ]}
            {...scrollProps}
        >
            {children}
        </ScrollView>
    );

    if (Platform.OS !== "ios") {
        return <View style={styles.flex}>{scroll}</View>;
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior="padding"
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            {scroll}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        minHeight: 0,
    },
    content: {
        flexGrow: 1,
    },
});

export default FormScrollView;
