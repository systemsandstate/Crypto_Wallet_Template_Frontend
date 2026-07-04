const appJson = require('./app.json');

/** @type {import('expo/config').ExpoConfig} */
module.exports = () => {
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID || appJson.expo.extra?.eas?.projectId;

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: {
        ...appJson.expo.extra?.eas,
        projectId,
      },
    },
  };
};
