import { StackActions } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";

type ParentTarget =
    | string
    | {
          name: string;
          params?: Record<string, unknown>;
      };

const STACK_PARENTS: Record<string, string> = {
    BalanceDetail: "Home",
    CreateInvoice: "Home",
    CashierGetPaid: "Home",
    ReceiveSelect: "Home",
    SendSelect: "Home",
    SendFundSelect: "Home",
    SendNetworkSelect: "SendSelect",
    Withdraw: "SendFundSelect",
    AddressBookPicker: "Withdraw",
    InvoiceSent: "Home",
    MyWallet: "ProfileMain",
    WalletReceive: "MyWallet",
    WalletSetup: "ProfileMain",
    EditPersonalInfo: "ProfileMain",
    ChangePassword: "ProfileMain",
    PrivacyPolicy: "ProfileMain",
    FAQ: "ProfileMain",
    SignUp: "SignIn",
    ForgotPassword: "SignIn",
    ForgotPasswordSentEmail: "ForgotPassword",
    NewPassword: "SignIn",
    SignUpAccountCreated: "SignIn",
};

const ROOT_PARENTS: Record<string, ParentTarget> = {
    AddressBook: "TabNavigator",
    WalletHelp: "TabNavigator",
    Profile: { name: "TabNavigator", params: { screen: "Profile" } },
    TransactionHistory: { name: "TabNavigator", params: { screen: "History" } },
    TransactionDetails: { name: "TabNavigator", params: { screen: "History" } },
    WalletDepositDetails: { name: "TabNavigator", params: { screen: "History" } },
    CreateInvoice: { name: "TabNavigator", params: { screen: "Dashboard" } },
    InvoiceSent: { name: "TabNavigator", params: { screen: "Dashboard" } },
    WalletSetup: { name: "TabNavigator", params: { screen: "Profile" } },
    MyWallet: { name: "TabNavigator", params: { screen: "Profile" } },
    WalletReceive: { name: "TabNavigator", params: { screen: "Profile" } },
    EditPersonalInfo: { name: "TabNavigator", params: { screen: "Profile" } },
    ChangePassword: { name: "TabNavigator", params: { screen: "Profile" } },
    PrivacyPolicy: { name: "TabNavigator", params: { screen: "Profile" } },
    FAQ: { name: "TabNavigator", params: { screen: "Profile" } },
};

function isInNavigator(navigation: NavigationProp<ParamListBase>, screenName: string): boolean {
    return (navigation.getState()?.routeNames ?? []).includes(screenName);
}

function getSharedDetailParent(navigation: NavigationProp<ParamListBase>): string {
    if (isInNavigator(navigation, "TransactionHistory")) return "TransactionHistory";
    if (isInNavigator(navigation, "AnalyticsMain")) return "AnalyticsMain";
    return "Home";
}

function resolveParent(
    routeName: string,
    navigation: NavigationProp<ParamListBase>,
    routeParams?: Record<string, unknown>
): ParentTarget | null {
    if (routeName === "SendNetworkSelect") {
        const returnScreen = routeParams?.returnScreen;
        if (typeof returnScreen === "string" && isInNavigator(navigation, returnScreen)) {
            return returnScreen;
        }
    }

    if (routeName === "Withdraw") {
        const returnScreen = routeParams?.returnScreen;
        if (typeof returnScreen === "string" && isInNavigator(navigation, returnScreen)) {
            return returnScreen;
        }
    }

    if (routeName === "TransactionDetails" || routeName === "WalletDepositDetails") {
        const stackParent = getSharedDetailParent(navigation);
        if (isInNavigator(navigation, stackParent)) {
            return stackParent;
        }
        return ROOT_PARENTS[routeName] ?? null;
    }

    const stackParent = STACK_PARENTS[routeName];
    if (stackParent && isInNavigator(navigation, stackParent)) {
        return stackParent;
    }

    if (routeName === "WalletReceive" && isInNavigator(navigation, "ReceiveSelect")) {
        return "ReceiveSelect";
    }

    if (routeName === "WalletReceive" && isInNavigator(navigation, "MyWallet")) {
        return "MyWallet";
    }

    return ROOT_PARENTS[routeName] ?? stackParent ?? null;
}

function navigateToTarget(navigation: NavigationProp<ParamListBase>, target: ParentTarget) {
    if (typeof target === "string") {
        navigation.navigate(target as never);
        return;
    }
    (navigation.navigate as (name: string, params?: object) => void)(target.name, target.params);
}

export function navigateUp(
    navigation: NavigationProp<ParamListBase>,
    routeName?: string,
    routeParams?: Record<string, unknown>
) {
    const state = navigation.getState();
    const currentRoute = routeName ?? state?.routes[state.index]?.name;
    if (!currentRoute) return;

    const parent = resolveParent(currentRoute, navigation, routeParams);
    if (parent) {
        navigateToTarget(navigation, parent);
        return;
    }

    if (state && state.index > 0) {
        navigation.dispatch(StackActions.pop(1));
        return;
    }

    const parentNavigation = navigation.getParent();
    if (parentNavigation?.canGoBack()) {
        const parentState = parentNavigation.getState();
        const parentRoute = parentState?.routes[parentState.index]?.name;
        if (parentRoute) {
            navigateUp(parentNavigation, parentRoute, undefined);
            return;
        }
    }
}
