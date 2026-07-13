import { View, Image, TouchableOpacity, Text, Platform} from "react-native";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../hooks/useAppSelector";
import * as ImagePicker from "expo-image-picker";

import { svg } from "../svg";
import { RootState } from "../store/store";
import { setAvatarUrl } from "../store/authSlice";
import { getStoredAvatarUrlAsync, readImageFileAsDataUrl, validateImageDataUrl } from "../utils/avatarStorage";
import { api } from "../services/api";
import { appAlert } from '../utils/appAlert';
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { pickWebImage } from "../utils/pickWebImage";

type Props = {
    size?: number;
    showEdit?: boolean;
    /** Inline layout for headers (no centered wrapper / change-photo link). */
    inline?: boolean;
    /** Icon tint when no custom photo is set. */
    iconColor?: string;
};

const ProfileAvatar: React.FC<Props> = ({
    size = 88,
    showEdit = true,
    inline = false,
    iconColor,
}) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { colors, isDark, FONTS } = useTheme();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const avatarUrl = useAppSelector((state: RootState) => state.auth.avatarUrl);

    useEffect(() => {
        if (!merchant?.id) return;
        if (merchant.avatarUrl && avatarUrl !== merchant.avatarUrl) {
            dispatch(setAvatarUrl({ merchantId: merchant.id, avatarUrl: merchant.avatarUrl }));
            return;
        }
        if (avatarUrl) return;
        void getStoredAvatarUrlAsync(merchant.id).then((stored) => {
            if (!stored) return;
            dispatch(setAvatarUrl({ merchantId: merchant.id, avatarUrl: stored }));
            if (!merchant.avatarUrl) {
                void api.updateProfile({ avatarUrl: stored }).catch(() => {});
            }
        });
    }, [avatarUrl, dispatch, merchant?.avatarUrl, merchant?.id]);

    const resolvedIconColor = iconColor ?? (isDark ? colors.headerMuted : colors.bodyTextColor);

    const applyDataUrl = (dataUrl: string) => {
        if (!merchant?.id) return;
        try {
            validateImageDataUrl(dataUrl);
            dispatch(setAvatarUrl({ merchantId: merchant.id, avatarUrl: dataUrl }));
            void api.updateProfile({ avatarUrl: dataUrl }).catch(() => {
                // Keep local avatar even if server sync fails.
            });
        } catch (err: any) {
            appAlert.alert(t.profile.changePhoto, err.message || t.profile.photoError);
        }
    };

    const applyFile = async (file: File) => {
        if (!merchant?.id) return;
        try {
            const dataUrl = await readImageFileAsDataUrl(file);
            applyDataUrl(dataUrl);
        } catch (err: any) {
            appAlert.alert(t.profile.changePhoto, err.message || t.profile.photoError);
        }
    };

    const openNativePicker = async () => {
        if (!merchant?.id) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            appAlert.alert(
                t.profile.changePhoto,
                t.profile.photoPermission
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true});

        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        if (asset.base64) {
            const mime = asset.mimeType || "image/jpeg";
            applyDataUrl(`data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
            dispatch(setAvatarUrl({ merchantId: merchant.id, avatarUrl: asset.uri }));
        }
    };

    const openPicker = () => {
        if (Platform.OS === "web") {
            pickWebImage((file) => void applyFile(file));
            return;
        }
        void openNativePicker();
    };

    const avatarImage = avatarUrl ? (
        <Image
            source={{ uri: avatarUrl }}
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.surfaceMuted,
                ...(isDark ? { borderWidth: 2, borderColor: colors.pureWhite } : null),
            }}
        />
    ) : (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.surfaceMuted,
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? "rgba(255,255,255,0.18)" : colors.border,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg.UserOneSvg color={resolvedIconColor} size={Math.round(size * 0.46)} />
        </View>
    );

    return (
        <View style={inline ? undefined : { alignItems: "center" }}>
            <TouchableOpacity
                activeOpacity={showEdit ? 0.85 : 1}
                onPress={showEdit ? openPicker : undefined}
                style={{ position: "relative" }}
            >
                {avatarImage}
                {showEdit ? (
                    <View
                        style={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: colors.linkColor,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: colors.pureWhite}}
                    >
                        <View style={{ transform: [{ scale: 0.65 }] }}>
                            <svg.EditPhotoSvg />
                        </View>
                    </View>
                ) : null}
            </TouchableOpacity>
            {showEdit ? (
                <TouchableOpacity onPress={openPicker}>
                    <Text
                        style={{
                            marginTop: 8,
                            ...FONTS.Mulish_600SemiBold,
                            fontSize: 12,
                            color: colors.linkColor}}
                    >
                        {t.profile.changePhoto}
                    </Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

export default ProfileAvatar;
