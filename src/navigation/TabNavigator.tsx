import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import BottomTabBar from "./BottomTabBar";
import {
    HomeStackNavigator,
    HistoryStackNavigator,
    AnalyticsStackNavigator,
    ProfileStackNavigator,
} from "./MerchantStacks";

export type MerchantTabParamList = {
    Dashboard: undefined;
    History: undefined;
    Analytics: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<MerchantTabParamList>();

const TabNavigator: React.FC = () => (
    <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{
            headerShown: false,
            lazy: false,
            freezeOnBlur: false,
        }}
    >
        <Tab.Screen name="Dashboard" component={HomeStackNavigator} />
        <Tab.Screen name="History" component={HistoryStackNavigator} />
        <Tab.Screen name="Analytics" component={AnalyticsStackNavigator} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
);

export default TabNavigator;
