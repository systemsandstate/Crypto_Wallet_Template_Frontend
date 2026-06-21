import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { screens } from "../screens";

const stackScreenOptions = {
    headerShown: false,
    gestureEnabled: false,
    contentStyle: { backgroundColor: "transparent" },
};

const HomeStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

export const HomeStackNavigator: React.FC = () => (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
        <HomeStack.Screen name="Dashboard" component={screens.Dashboard} />
        <HomeStack.Screen name="CreateInvoice" component={screens.CreateInvoice} />
        <HomeStack.Screen name="FundTransfer" component={screens.FundTransfer} />
        <HomeStack.Screen name="Withdraw" component={screens.Withdraw} />
        <HomeStack.Screen name="InvoiceSent" component={screens.InvoiceSent} />
        <HomeStack.Screen name="TransactionDetails" component={screens.TransactionDetails} />
    </HomeStack.Navigator>
);

export const HistoryStackNavigator: React.FC = () => (
    <HistoryStack.Navigator screenOptions={stackScreenOptions}>
        <HistoryStack.Screen name="TransactionHistory">
            {(props) => <screens.TransactionHistory {...props} embedded />}
        </HistoryStack.Screen>
        <HistoryStack.Screen name="TransactionDetails" component={screens.TransactionDetails} />
    </HistoryStack.Navigator>
);

const AnalyticsStack = createNativeStackNavigator();

export const AnalyticsStackNavigator: React.FC = () => (
    <AnalyticsStack.Navigator screenOptions={stackScreenOptions}>
        <AnalyticsStack.Screen name="AnalyticsMain" component={screens.Analytics} />
        <AnalyticsStack.Screen name="TransactionDetails" component={screens.TransactionDetails} />
    </AnalyticsStack.Navigator>
);

export const ProfileStackNavigator: React.FC = () => (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
        <ProfileStack.Screen name="ProfileMain">
            {(props) => <screens.Profile {...props} embedded />}
        </ProfileStack.Screen>
        <ProfileStack.Screen name="EditPersonalInfo" component={screens.EditPersonalInfo} />
        <ProfileStack.Screen name="ChangePassword" component={screens.ChangePassword} />
        <ProfileStack.Screen name="PrivacyPolicy" component={screens.PrivacyPolicy} />
        <ProfileStack.Screen name="FAQ" component={screens.FAQ} />
    </ProfileStack.Navigator>
);
