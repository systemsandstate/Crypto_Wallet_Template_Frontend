import { View } from "react-native";
import React from "react";
import { useSelector } from "react-redux";

import { components } from "../components";
import { theme } from "../constants";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { RootState } from "../store/store";

const Analytics: React.FC = () => {
    const merchant = useSelector((state: RootState) => state.auth.merchant);

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <components.MerchantTabHeader
                eyebrow={merchant?.businessName || "Merchant"}
                title="Analytics"
                subtitle="Reports and insights · Coming soon"
            />
            <View style={{ flex: 1, paddingBottom: TAB_BAR_HEIGHT + 16 }} />
        </View>
    );
};

export default Analytics;
