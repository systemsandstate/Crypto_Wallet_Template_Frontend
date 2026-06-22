export type AppLocale = "es" | "en";

export type TranslationDict = {
    common: {
        cancel: string;
        ok: string;
        error: string;
        merchant: string;
        loading: string;
        sessionExpired: string;
        sessionExpiredMessage: string;
    };
    language: {
        title: string;
        spanish: string;
        english: string;
    };
    tabs: {
        home: string;
        history: string;
        analytics: string;
        profile: string;
    };
    auth: {
        signIn: string;
        signUp: string;
        signOut: string;
        signOutConfirm: string;
        signOutMessage: string;
        appTitle: string;
        appSubtitle: string;
        emailPlaceholder: string;
        passwordPlaceholder: string;
        rememberMe: string;
        forgotPassword: string;
        noAccount: string;
        registerNow: string;
        signInFailed: string;
        invalidCredentials: string;
        enterEmailPassword: string;
        createAccountTitle: string;
        createAccountSubtitle: string;
        businessNamePlaceholder: string;
        passwordRulesPlaceholder: string;
        alreadyHaveAccount: string;
        registrationFailed: string;
        fillAllFields: string;
        passwordMinLength: string;
    };
    dashboard: {
        welcomeBack: string;
        subtitle: string;
        merchantAccount: string;
        deposit: string;
        makeTransfer: string;
        withdraw: string;
        viewHistory: string;
        recentPayments: string;
        noPayments: string;
    };
    balance: {
        merchantWallet: string;
        totalReceived: string;
        pending: string;
        paid: string;
        recent: string;
        multiChain: string;
    };
    payment: {
        createTitle: string;
        newPayment: string;
        createDescription: string;
        amountPlaceholder: string;
        referencePlaceholder: string;
        generateQr: string;
        paymentFailed: string;
        invalidAmount: string;
        createFailed: string;
        recentPayments: string;
        noRecentPayments: string;
        usdtPayment: string;
        statusWaiting: string;
        statusPaid: string;
        statusExpired: string;
        statusFailed: string;
        statusCancelled: string;
        filterAll: string;
        filterPending: string;
        filterPaid: string;
        filterExpired: string;
        filterFailed: string;
        filterCancelled: string;
        historyTitle: string;
        historySubtitle: string;
        noHistory: string;
    };
    profile: {
        title: string;
        yourAccount: string;
        changePhoto: string;
        editBusinessInfo: string;
        changePassword: string;
        privacyPolicy: string;
        termsOfService: string;
        logOut: string;
        photoPermission: string;
        photoError: string;
        invalidImage: string;
        imageTooLarge: string;
    };
    analytics: {
        title: string;
        subtitle: string;
    };
    splash: {
        title: string;
        subtitle: string;
    };
};
