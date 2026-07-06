import { Text} from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useState } from "react";

import { theme } from "../constants";
import { components } from "../components";
import { svg } from "../svg";
import { api } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import { appAlert } from '../utils/appAlert';

const ForgotPassword: React.FC = ({ navigation }: any) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!email.trim()) {
            appAlert.alert(t.common.error, t.auth.enterEmail);
            return;
        }
        setLoading(true);
        try {
            await api.forgotPassword({ email: email.trim() });
            navigation.navigate("ForgotPasswordSentEmail", { mode: "email_sent" });
        } catch (err: any) {
            appAlert.alert(t.common.error, err.message || t.auth.couldNotSendReset);
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title={t.auth.forgotPasswordTitle} goBack={true} />}
        >
            <Text
                style={{
                    ...theme.FONTS.H3,
                    color: theme.COLORS.mainDark,
                    marginBottom: 12,
                    textAlign: "center"}}
            >
                {t.auth.resetPassword}
            </Text>
            <Text
                style={{
                    ...theme.FONTS.Mulish_400Regular,
                    fontSize: 16,
                    color: theme.COLORS.bodyTextColor,
                    lineHeight: 16 * 1.7,
                    marginBottom: 24,
                    textAlign: "center"}}
            >
                {t.auth.resetPasswordInstructions}
            </Text>
            <components.InputField
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={{ marginBottom: 20 }}
                rightIcon={<svg.CheckSvg />}
            />
            {loading ? (
                <LoadingSpinner size={48} />
            ) : (
                <components.Button title={t.common.send} onPress={handleSend} />
            )}
        </components.AuthScreenLayout>
    );
};

export default ForgotPassword;
