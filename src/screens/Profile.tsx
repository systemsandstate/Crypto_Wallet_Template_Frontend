import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import { svg } from "../svg";
import { theme } from "../constants";
import { components } from "../components";
import { RootState } from "../store/store";
import { logoutAndNavigateToSignIn } from "../navigation/logoutAndNavigateToSignIn";
import { setAvatarUrl } from "../store/authSlice";
import { getStoredAvatarUrlAsync } from "../utils/avatarStorage";
import { confirmAction } from "../utils/confirm";
import { useTranslation } from "../hooks/useTranslation";

const Profile: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
    const navigation: any = useNavigation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const avatarUrl = useSelector((state: RootState) => state.auth.avatarUrl);

    useEffect(() => {
        if (!merchant?.id || avatarUrl) return;
        getStoredAvatarUrlAsync(merchant.id).then((stored) => {
            if (stored) {
                dispatch(setAvatarUrl({ merchantId: merchant.id, avatarUrl: stored }));
            }
        });
    }, [merchant?.id, avatarUrl, dispatch]);

    const handleLogout = () => {
        confirmAction({
            title: t.auth.signOutConfirm,
            message: t.auth.signOutMessage,
            confirmLabel: t.auth.signOut,
            cancelLabel: t.common.cancel,
            destructive: true,
            onConfirm: () => logoutAndNavigateToSignIn(dispatch),
        });
    };

    const menu = (
        <components.MerchantContent style={{ paddingVertical: 20 }}>
            <components.ProfileCategory
                title={t.profile.editBusinessInfo}
                icon={<svg.UserOneSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("EditPersonalInfo")}
            />
            <components.ProfileCategory
                title={t.profile.changePassword}
                icon={<svg.FaceIdSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("ChangePassword")}
            />
            <components.ProfileCategory
                title={t.profile.privacyPolicy}
                icon={<svg.FileTextSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("PrivacyPolicy")}
            />
            <components.ProfileCategory
                title={t.profile.termsOfService}
                icon={<svg.FileTextSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("FAQ")}
            />
            <components.ProfileCategory
                title={t.profile.logOut}
                icon={<svg.LogOutSvg />}
                titleStyle={{ color: "#FF5887" }}
                onPress={handleLogout}
            />
        </components.MerchantContent>
    );

    const avatarSection = (
        <View style={{ alignItems: "center", paddingTop: 20, paddingBottom: 8 }}>
            <components.ProfileAvatar />
            {merchant?.phone ? (
                <Text
                    style={{
                        ...theme.FONTS.Mulish_400Regular,
                        color: theme.COLORS.bodyTextColor,
                        fontSize: 14,
                        marginTop: 12,
                    }}
                >
                    {merchant.phone}
                </Text>
            ) : null}
        </View>
    );

    if (embedded) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
                <components.MerchantTabHeader
                    eyebrow={t.profile.yourAccount}
                    title={merchant?.businessName || t.common.merchant}
                    subtitle={merchant?.email}
                />
                <components.ScreenScroll>
                    {avatarSection}
                    {menu}
                </components.ScreenScroll>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <components.Header title={t.profile.title} goBack={true} />
            <components.ScreenScroll withTabBarInset={false}>
                <components.MerchantContent
                    style={{
                        paddingTop: 24,
                        paddingBottom: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: "#CED6E1",
                        alignItems: "center",
                    }}
                >
                    <components.ProfileAvatar />
                    <Text style={{ ...theme.FONTS.H3, color: theme.COLORS.mainDark, marginTop: 16, marginBottom: 4 }}>
                        {merchant?.businessName || "—"}
                    </Text>
                    <Text style={{ ...theme.FONTS.Mulish_400Regular, color: theme.COLORS.bodyTextColor, fontSize: 16 }}>
                        {merchant?.email}
                    </Text>
                </components.MerchantContent>
                {menu}
            </components.ScreenScroll>
        </SafeAreaView>
    );
};

export default Profile;
