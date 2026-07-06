import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useTheme } from "../hooks/useTheme";
import TabNavigator from "./TabNavigator";
import MerchantTabRedirect from "./MerchantTabRedirect";

import SignIn from "../screens/SignIn";
import SignUp from "../screens/SignUp";
import SignUpAccountCreated from "../screens/SignUpAccountCreated";
import ForgotPassword from "../screens/ForgotPassword";
import ForgotPasswordSentEmail from "../screens/ForgotPasswordSentEmail";
import NewPassword from "../screens/NewPassword";
import WalletSetup from "../screens/WalletSetup";
import Wallets from "../screens/Wallets";
import MyWallet from "../screens/MyWallet";
import WalletReceive from "../screens/WalletReceive";
import WalletHelp from "../screens/WalletHelp";
import AddressBook from "../screens/AddressBook";

const Stack = createNativeStackNavigator();

const redirect = (tab: "Dashboard" | "History" | "Profile") => (props: any) => (
    <MerchantTabRedirect {...props} route={{ ...props.route, params: { ...props.route?.params, tab } }} />
);

const StackNavigator: React.FC<{ initialRoute?: "SignIn" | "TabNavigator" }> = ({
    initialRoute = "SignIn",
}) => {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
                gestureEnabled: false,
                contentStyle: { backgroundColor: colors.bgColor },
            }}
        >
            <Stack.Screen name="TabNavigator" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="SignIn" component={SignIn} options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen
                name="SignUpAccountCreated"
                component={SignUpAccountCreated}
                options={{ headerShown: false }}
            />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
            <Stack.Screen
                name="ForgotPasswordSentEmail"
                component={ForgotPasswordSentEmail}
                options={{ headerShown: false }}
            />
            <Stack.Screen name="NewPassword" component={NewPassword} options={{ headerShown: false }} />
            <Stack.Screen name="WalletSetup" component={WalletSetup} options={{ headerShown: false }} />
            <Stack.Screen name="Wallets" component={Wallets} options={{ headerShown: false }} />
            <Stack.Screen name="MyWallet" component={MyWallet} options={{ headerShown: false }} />
            <Stack.Screen name="WalletReceive" component={WalletReceive} options={{ headerShown: false }} />
            <Stack.Screen name="WalletHelp" component={WalletHelp} options={{ headerShown: false }} />
            <Stack.Screen name="AddressBook" component={AddressBook} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={redirect("Profile")} options={{ headerShown: false }} />
            <Stack.Screen name="EditPersonalInfo" component={redirect("Profile")} options={{ headerShown: false }} />
            <Stack.Screen name="ChangePassword" component={redirect("Profile")} options={{ headerShown: false }} />
            <Stack.Screen name="FAQ" component={redirect("Profile")} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={redirect("Profile")} options={{ headerShown: false }} />
            <Stack.Screen name="CreateInvoice" component={redirect("Dashboard")} options={{ headerShown: false }} />
            <Stack.Screen name="InvoiceSent" component={redirect("Dashboard")} options={{ headerShown: false }} />
            <Stack.Screen name="TransactionDetails" component={redirect("History")} options={{ headerShown: false }} />
            <Stack.Screen name="TransactionHistory" component={redirect("History")} options={{ headerShown: false }} />
            <Stack.Screen
                name="WalletDepositDetails"
                component={redirect("History")}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

export default StackNavigator;
