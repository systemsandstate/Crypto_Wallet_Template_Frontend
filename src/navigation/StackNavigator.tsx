import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { theme } from "../constants";
import { screens } from "../screens";

import TabNavigator from "./TabNavigator";
import MerchantTabRedirect from "./MerchantTabRedirect";

const Stack = createNativeStackNavigator();

const redirect = (tab: "Dashboard" | "History" | "Profile") => (props: any) => (
    <MerchantTabRedirect {...props} route={{ ...props.route, params: { ...props.route?.params, tab } }} />
);

const StackNavigator: React.FC<{ initialRoute?: "SignIn" | "TabNavigator" }> = ({
    initialRoute = "SignIn",
}) => {
    return (
        <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
                gestureEnabled: false,
                contentStyle: { backgroundColor: theme.COLORS.bgColor },
            }}
        >
            <Stack.Screen
                name="Onboarding"
                component={screens.Onboarding}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TabNavigator"
                component={TabNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Profile"
                component={redirect("Profile")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="EditPersonalInfo"
                component={redirect("Profile")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ExchangeRates"
                component={screens.ExchangeRates}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CardMenu"
                component={screens.CardMenu}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CardDetails"
                component={screens.CardDetails}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SignIn"
                component={screens.SignIn}
                options={{ headerShown: false, animation: "fade" }}
            />
            <Stack.Screen
                name="SignUp"
                component={screens.SignUp}
                options={{ headerShown: false, animation: "fade" }}
            />
            <Stack.Screen
                name="SignInCode"
                component={screens.SignInCode}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ChangePassword"
                component={redirect("Profile")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ChangePinCode"
                component={screens.ChangePinCode}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SignUpAccountCreated"
                component={screens.SignUpAccountCreated}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Statistics"
                component={screens.Statistics}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="StatisticsChooseCard"
                component={screens.StatisticsChooseCard}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TopUpPayment"
                component={screens.TopUpPayment}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TransactionDetails"
                component={redirect("History")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TransactionHistory"
                component={redirect("History")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VerifyYourPhoneNumber"
                component={screens.VerifyYourPhoneNumber}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ConfirmationCode"
                component={screens.ConfirmationCode}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreateInvoice"
                component={redirect("Dashboard")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="FAQ"
                component={redirect("Profile")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ForgotPassword"
                component={screens.ForgotPassword}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ForgotPasswordSentEmail"
                component={screens.ForgotPasswordSentEmail}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="FundTransfer"
                component={screens.FundTransfer}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="IbanPayment"
                component={screens.IbanPayment}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="InvoiceSent"
                component={redirect("Dashboard")}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MobilePayment"
                component={screens.MobilePayment}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="NewPassword"
                component={screens.NewPassword}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="OpenMoneybox"
                component={screens.OpenMoneybox}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="OpenNewCard"
                component={screens.OpenNewCard}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PaymentFailed"
                component={screens.PaymentFailed}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Payments"
                component={screens.Payments}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PaymentSuccess"
                component={screens.PaymentSuccess}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PrivacyPolicy"
                component={redirect("Profile")}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

export default StackNavigator;
