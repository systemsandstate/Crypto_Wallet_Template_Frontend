import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { theme } from "../constants";

type Props = {
    children: React.ReactNode;
};

type State = {
    error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error("App error boundary:", error);
    }

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        return (
            <View style={styles.container}>
                <Text style={styles.title}>Something went wrong</Text>
                <Text style={styles.message}>{this.state.error.message}</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => this.setState({ error: null })}
                >
                    <Text style={styles.buttonText}>Try again</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: theme.COLORS.bgColor,
    },
    title: {
        ...theme.FONTS.H4,
        color: theme.COLORS.mainDark,
        marginBottom: 12,
        textAlign: "center",
    },
    message: {
        ...theme.FONTS.Mulish_400Regular,
        fontSize: 14,
        color: theme.COLORS.bodyTextColor,
        textAlign: "center",
        marginBottom: 24,
    },
    button: {
        backgroundColor: theme.COLORS.mainDark,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    buttonText: {
        ...theme.FONTS.Mulish_600SemiBold,
        color: theme.COLORS.white,
    },
});
