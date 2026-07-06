import { View, Text } from "react-native";
import React, { useEffect, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../hooks/useAppSelector";
import { useNavigation } from "@react-navigation/native";

import { svg } from "../svg";
import { components } from "../components";
import { RootState } from "../store/store";
import { logoutAndNavigateToSignIn } from "../navigation/logoutAndNavigateToSignIn";
import { unregisterPushTokenFromBackend } from "../services/pushNotifications";
import { setAvatarUrl } from "../store/authSlice";
import { getStoredAvatarUrlAsync } from "../utils/avatarStorage";
import { confirmAction } from "../utils/confirm";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { MENU_ICON_SIZE } from "../constants/menuIcon";
import { createMerchantTabPageStyles } from "../styles/merchantTabPageChrome";

const Profile: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
    const navigation: any = useNavigation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { colors, isDark, FONTS } = useTheme();
    const pageStyles = useMemo(() => createMerchantTabPageStyles(colors), [colors]);
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const avatarUrl = useAppSelector((state: RootState) => state.auth.avatarUrl);

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
            onConfirm: () => {
                void unregisterPushTokenFromBackend();
                logoutAndNavigateToSignIn(dispatch);
            },
        });
    };

    const menuIconColor = isDark ? colors.pureWhite : colors.mainDark;

    const menu = (
        <components.MerchantContent style={{ paddingVertical: 20 }}>
            <components.ProfileCategory
                title={t.wallet.walletsTitle}
                icon={<svg.MyWalletSvg size={MENU_ICON_SIZE} color={menuIconColor} />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("Wallets")}
            />
            <components.ProfileCategory
                title={t.profile.editBusinessInfo}
                icon={<svg.EditSvg size={MENU_ICON_SIZE} color={menuIconColor} />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("EditPersonalInfo")}
            />
            <components.ProfileCategory
                title={t.profile.changePassword}
                icon={<svg.FaceIdSvg size={MENU_ICON_SIZE} color={menuIconColor} />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("ChangePassword")}
            />
            <components.ProfileCategory
                title={t.profile.privacyPolicy}
                icon={<svg.FileTextSvg size={MENU_ICON_SIZE} color={menuIconColor} />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("PrivacyPolicy")}
            />
            <components.ProfileCategory
                title={t.profile.termsOfService}
                icon={<svg.FileTextSvg size={MENU_ICON_SIZE} color={menuIconColor} />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("FAQ")}
            />
            <components.ProfileCategory
                title={t.profile.logOut}
                icon={<svg.LogOutSvg size={MENU_ICON_SIZE} color={colors.linkColor} />}
                titleStyle={{ color: colors.linkColor }}
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
                        ...FONTS.Mulish_400Regular,
                        color: colors.bodyTextColor,
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
            <View style={pageStyles.root}>
                <View style={pageStyles.headerWrap}>
                    <components.MerchantTabHeader
                        eyebrow={t.profile.yourAccount}
                        title={merchant?.businessName || t.common.merchant}
                        subtitle={merchant?.email}
                    />
                </View>
                <View style={pageStyles.contentArea}>
                    <components.ScreenScroll>
                        {avatarSection}
                        {menu}
                    </components.ScreenScroll>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgColor }}>
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
                    <Text style={{ ...FONTS.H3, color: colors.mainDark, marginTop: 16, marginBottom: 4 }}>
                        {merchant?.businessName || "—"}
                    </Text>
                    <Text style={{ ...FONTS.Mulish_400Regular, color: colors.bodyTextColor, fontSize: 16 }}>
                        {merchant?.email}
                    </Text>
                </components.MerchantContent>
                {menu}
            </components.ScreenScroll>
        </SafeAreaView>
    );
};

export default Profile;
