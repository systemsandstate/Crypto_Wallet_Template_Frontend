import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Dashboard from "../screens/Dashboard";
import BalanceDetail from "../screens/BalanceDetail";
import CreateInvoice from "../screens/CreateInvoice";
import ReceiveSelect from "../screens/ReceiveSelect";
import SendFundSelect from "../screens/SendFundSelect";
import SendNetworkSelect from "../screens/SendNetworkSelect";
import Withdraw from "../screens/Withdraw";
import WalletReceive from "../screens/WalletReceive";
import AddressBookPicker from "../screens/AddressBookPicker";
import InvoiceSent from "../screens/InvoiceSent";
import TransactionDetails from "../screens/TransactionDetails";
import WalletDepositDetails from "../screens/WalletDepositDetails";
import TransactionHistory from "../screens/TransactionHistory";
import Analytics from "../screens/Analytics";
import Profile from "../screens/Profile";
import MyWallet from "../screens/MyWallet";
import WalletSetup from "../screens/WalletSetup";
import EditPersonalInfo from "../screens/EditPersonalInfo";
import ChangePassword from "../screens/ChangePassword";
import PrivacyPolicy from "../screens/PrivacyPolicy";
import FAQ from "../screens/FAQ";

const stackScreenOptions = {
    headerShown: false,
    gestureEnabled: false,
    freezeOnBlur: false,
    contentStyle: { backgroundColor: "transparent" },
};

const HomeStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AnalyticsStack = createNativeStackNavigator();

export const HomeStackNavigator: React.FC = () => (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
        <HomeStack.Screen name="Home" component={Dashboard} />
        <HomeStack.Screen name="BalanceDetail" component={BalanceDetail} />
        <HomeStack.Screen name="CreateInvoice" component={CreateInvoice} />
        <HomeStack.Screen name="ReceiveSelect" component={ReceiveSelect} />
        <HomeStack.Screen name="SendSelect" component={SendFundSelect} />
        <HomeStack.Screen name="SendFundSelect" component={SendFundSelect} />
        <HomeStack.Screen name="SendNetworkSelect" component={SendNetworkSelect} />
        <HomeStack.Screen name="Withdraw" component={Withdraw} />
        <HomeStack.Screen name="WalletReceive" component={WalletReceive} />
        <HomeStack.Screen name="AddressBookPicker" component={AddressBookPicker} />
        <HomeStack.Screen name="InvoiceSent" component={InvoiceSent} />
        <HomeStack.Screen name="TransactionDetails" component={TransactionDetails} />
        <HomeStack.Screen name="WalletDepositDetails" component={WalletDepositDetails} />
    </HomeStack.Navigator>
);

export const HistoryStackNavigator: React.FC = () => (
    <HistoryStack.Navigator screenOptions={stackScreenOptions}>
        <HistoryStack.Screen name="TransactionHistory">
            {(props) => <TransactionHistory {...props} embedded />}
        </HistoryStack.Screen>
        <HistoryStack.Screen name="TransactionDetails" component={TransactionDetails} />
        <HistoryStack.Screen name="WalletDepositDetails" component={WalletDepositDetails} />
    </HistoryStack.Navigator>
);

export const AnalyticsStackNavigator: React.FC = () => (
    <AnalyticsStack.Navigator screenOptions={stackScreenOptions}>
        <AnalyticsStack.Screen name="AnalyticsMain" component={Analytics} />
        <AnalyticsStack.Screen name="TransactionDetails" component={TransactionDetails} />
        <AnalyticsStack.Screen name="WalletDepositDetails" component={WalletDepositDetails} />
    </AnalyticsStack.Navigator>
);

export const ProfileStackNavigator: React.FC = () => (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
        <ProfileStack.Screen name="ProfileMain">
            {(props) => <Profile {...props} embedded />}
        </ProfileStack.Screen>
        <ProfileStack.Screen name="MyWallet" component={MyWallet} />
        <ProfileStack.Screen name="WalletReceive" component={WalletReceive} />
        <ProfileStack.Screen name="WalletSetup" component={WalletSetup} />
        <ProfileStack.Screen name="EditPersonalInfo" component={EditPersonalInfo} />
        <ProfileStack.Screen name="ChangePassword" component={ChangePassword} />
        <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <ProfileStack.Screen name="FAQ" component={FAQ} />
    </ProfileStack.Navigator>
);
