import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    View,
} from "react-native";

type Props = ScrollViewProps & {
    children: React.ReactNode;
    keyboardVerticalOffset?: number;
};

const FormScrollView: React.FC<Props> = ({
    children,
    keyboardVerticalOffset = Platform.OS === "ios" ? 72 : 0,
    contentContainerStyle,
    ...scrollProps
}) => {
    const scroll = (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, contentContainerStyle]}
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
