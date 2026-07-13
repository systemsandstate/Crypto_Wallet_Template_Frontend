import { Platform } from "react-native";
import React, { useEffect, useMemo } from "react";

import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import SignInForm from "./SignInForm";
import { appAlert } from '../utils/appAlert';

const SignIn: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
            const message = sessionStorage.getItem("sessionExpired");
            if (message) {
                sessionStorage.removeItem("sessionExpired");
                window.alert(message);
                return;
            }
        }
        if (route.params?.sessionExpired) {
            appAlert.alert(t.common.sessionExpired, route.params.sessionExpired);
            navigation.setParams({ sessionExpired: undefined });
        }
    }, [route.params?.sessionExpired, navigation, t.common.sessionExpired]);

    const header = useMemo(() => <components.Header goBack={true} />, []);

    return (
        <components.AuthScreenLayout header={header}>
            <SignInForm t={t} navigation={navigation} />
        </components.AuthScreenLayout>
    );
};

export default SignIn;
