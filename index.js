import 'react-native-get-random-values';
import { setupBufferPolyfill, setupCryptoPolyfills } from './src/polyfills/crypto';
setupBufferPolyfill();
import { setupTextEncodingPolyfills } from './src/polyfills/textEncoding';
setupTextEncodingPolyfills();
setupCryptoPolyfills();
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

// Avoids native-screen + TextInput crashes in Expo Go on Android.
enableScreens(false);

import { registerRootComponent } from 'expo';

import App from './App';
import { installSafeWebReloadPolyfill } from './src/polyfills/safeWebReload';

installSafeWebReloadPolyfill();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
