import 'react-native-get-random-values';
import { setupTextEncodingPolyfills } from './src/polyfills/textEncoding';
setupTextEncodingPolyfills();
import { setupCryptoPolyfills } from './src/polyfills/crypto';
setupCryptoPolyfills();
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

// Avoids native-screen + TextInput crashes in Expo Go on Android.
enableScreens(false);

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
