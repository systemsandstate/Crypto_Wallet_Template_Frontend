import { View, Text, ScrollView } from "react-native";
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
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { getStoredAvatarUrlAsync } from "../utils/avatarStorage";
import { confirmAction } from "../utils/confirm";

const Profile: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
    const navigation: any = useNavigation();
    const dispatch = useDispatch();
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
            title: "Log out",
            message: "Are you sure you want to log out?",
            confirmLabel: "Log out",
            destructive: true,
            onConfirm: () => logoutAndNavigateToSignIn(dispatch),
        });
    };

    const menu = (
        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            <components.ProfileCategory
                title="Edit business info"
                icon={<svg.UserOneSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("EditPersonalInfo")}
            />
            <components.ProfileCategory
                title="Change password"
                icon={<svg.FaceIdSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("ChangePassword")}
            />
            <components.ProfileCategory
                title="Privacy policy"
                icon={<svg.FileTextSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("PrivacyPolicy")}
            />
            <components.ProfileCategory
                title="Terms of service"
                icon={<svg.FileTextSvg />}
                rightElement={<svg.ArrowOneSvg />}
                onPress={() => navigation.navigate("FAQ")}
            />
            <components.ProfileCategory
                title="Log out"
                icon={<svg.LogOutSvg />}
                titleStyle={{ color: "#FF5887" }}
                onPress={handleLogout}
            />
        </View>
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
                    eyebrow="Your account"
                    title={merchant?.businessName || "Merchant"}
                    subtitle={merchant?.email}
                />
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: TAB_BAR_HEIGHT + 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    {avatarSection}
                    {menu}
                </ScrollView>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <components.Header title="Profile" goBack={true} />
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View
                    style={{
                        paddingHorizontal: 20,
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
                </View>
                {menu}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
