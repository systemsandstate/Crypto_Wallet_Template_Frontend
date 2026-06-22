import {
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    ImageBackground,
    Text,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shadow } from "react-native-shadow-2";

import { theme } from "../constants";
import { components } from "../components";

const ChangePinCode: React.FC = () => {
    const renderHeader = () => {
        return <components.Header title={"Change PIN code"} goBack={true} />;
    };

    const renderContent = () => {
        return (
            <components.FormScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 20,
                    paddingTop: 10,
                }}
                showsVerticalScrollIndicator={false}
            >
                <components.InputField
                    placeholder="••••"
                    containerStyle={{ marginTop: 20 }}
                    rightIcon={
                        <Image
                            source={require("../assets/other-icons/09.png")}
                            style={{ width: 16, height: 16 }}
                        />
                    }
                />
                <components.InputField
                    placeholder="New PIN"
                    containerStyle={{ marginTop: 14 }}
                    rightIcon={
                        <Image
                            source={require("../assets/other-icons/09.png")}
                            style={{ width: 16, height: 16 }}
                        />
                    }
                />
                <components.InputField
                    placeholder="Confirm PIN"
                    containerStyle={{ marginTop: 14, marginBottom: 14 }}
                    rightIcon={
                        <Image
                            source={require("../assets/other-icons/09.png")}
                            style={{ width: 16, height: 16 }}
                        />
                    }
                />
                <components.Button
                    title="Save"
                    containerStyle={{ marginBottom: 20 }}
                />
            </components.FormScrollView>
        );
    };

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}
        >
            {renderHeader()}
            {renderContent()}
        </SafeAreaView>
    );
};

export default ChangePinCode;
