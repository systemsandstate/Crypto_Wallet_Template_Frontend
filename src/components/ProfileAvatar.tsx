import { View, Image, TouchableOpacity, Text, Platform, Alert } from "react-native";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";

import { theme } from "../constants";
import { svg } from "../svg";
import { RootState } from "../store/store";
import { setAvatarUrl } from "../store/authSlice";
import { readImageFileAsDataUrl, validateImageDataUrl } from "../utils/avatarStorage";

const DEFAULT_AVATAR = require("../assets/users/07.png");

type Props = {
    size?: number;
    showEdit?: boolean;
};

const ProfileAvatar: React.FC<Props> = ({ size = 88, showEdit = true }) => {
    const dispatch = useDispatch();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const avatarUrl = useSelector((state: RootState) => state.auth.avatarUrl);

    const applyDataUrl = (dataUrl: string) => {
        if (!merchant?.id) return;
        try {
            validateImageDataUrl(dataUrl);
            dispatch(setAvatarUrl({ merchantId: merchant.id, avatarUrl: dataUrl }));
        } catch (err: any) {
            Alert.alert("Photo", err.message || "Could not update photo");
        }
    };

    const applyFile = async (file: File) => {
        if (!merchant?.id) return;
        try {
            const dataUrl = await readImageFileAsDataUrl(file);
            applyDataUrl(dataUrl);
        } catch (err: any) {
            Alert.alert("Photo", err.message || "Could not update photo");
        }
    };

    const openNativePicker = async () => {
        if (!merchant?.id) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Photo",
                "Please allow photo library access to change your profile picture."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

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
        if (Platform.OS === "web" && typeof document !== "undefined") {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = () => {
                const file = input.files?.[0];
                if (file) void applyFile(file);
            };
            input.click();
            return;
        }
        void openNativePicker();
    };

    return (
        <View style={{ alignItems: "center" }}>
            <TouchableOpacity
                activeOpacity={showEdit ? 0.85 : 1}
                onPress={showEdit ? openPicker : undefined}
                style={{ position: "relative" }}
            >
                <Image
                    source={avatarUrl ? { uri: avatarUrl } : DEFAULT_AVATAR}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: "#E8ECF0",
                    }}
                />
                {showEdit ? (
                    <View
                        style={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: theme.COLORS.linkColor,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: theme.COLORS.white,
                        }}
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
                            ...theme.FONTS.Mulish_600SemiBold,
                            fontSize: 12,
                            color: theme.COLORS.linkColor,
                        }}
                    >
                        Change photo
                    </Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

export default ProfileAvatar;
