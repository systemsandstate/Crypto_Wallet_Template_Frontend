import React from "react";
import { useSelector } from "react-redux";

import { components } from "../components";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";

const Analytics: React.FC = () => {
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const { t } = useTranslation();

    return (
        <components.ScreenScroll>
            <components.MerchantTabHeader
                eyebrow={merchant?.businessName || t.common.merchant}
                title={t.analytics.title}
                subtitle={t.analytics.subtitle}
            />
        </components.ScreenScroll>
    );
};

export default Analytics;
