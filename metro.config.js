const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const browserGetUrl = path.join(
  __dirname,
  'node_modules/ethers/lib.commonjs/utils/geturl-browser.js'
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform !== 'web' &&
    (moduleName.endsWith('/utils/geturl.js') || moduleName === './geturl.js')
  ) {
    return {
      filePath: browserGetUrl,
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
