const appJson = require('./app.json');

const PLACEHOLDER_PROJECT_ID = 'REPLACE_WITH_EAS_PROJECT_ID';

function resolveProjectId() {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  const fromConfig = appJson.expo.extra?.eas?.projectId;
  const projectId = fromEnv || fromConfig;
  if (!projectId || projectId === PLACEHOLDER_PROJECT_ID) {
    return undefined;
  }
  return projectId;
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = () => {
  const projectId = resolveProjectId();
  const channel = process.env.EAS_UPDATE_CHANNEL?.trim() || 'production';

  // Bare workflow (android/ present) requires a concrete string, not a policy object.
  const runtimeVersion = appJson.expo.version || '1.0.0';

  return {
    ...appJson.expo,
    runtimeVersion,
    updates: {
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
      ...(projectId
        ? {
            url: `https://u.expo.dev/${projectId}`,
            // Lets locally built APKs (not EAS Build) pull from the same channel.
            requestHeaders: {
              'expo-channel-name': channel,
            },
          }
        : {}),
    },
    extra: {
      ...appJson.expo.extra,
      eas: {
        ...appJson.expo.extra?.eas,
        projectId: projectId || PLACEHOLDER_PROJECT_ID,
      },
      updatesChannel: channel,
    },
  };
};
