const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const projectEthersEsm = path.join(__dirname, 'node_modules/ethers/lib.esm/index.js');
const browserGetUrl = path.join(
  __dirname,
  'node_modules/ethers/lib.commonjs/utils/geturl-browser.js'
);

function tryResolveSourceFile(filePath) {
  if (fs.existsSync(filePath)) {
    return { filePath, type: 'sourceFile' };
  }
  return null;
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Native/Hermes cannot load ethers Node geturl — force browser shim.
  if (
    platform !== 'web' &&
    (moduleName.endsWith('/utils/geturl.js') || moduleName === './geturl.js')
  ) {
    return {
      filePath: browserGetUrl,
      type: 'sourceFile',
    };
  }

  // One ethers copy for the whole app (avoids broken nested tronweb/ethers resolution).
  if (moduleName === 'ethers') {
    const resolved = tryResolveSourceFile(projectEthersEsm);
    if (resolved) return resolved;
  }

  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // Metro file-map can miss newly installed nested ESM files; resolve from disk.
    if (
      (moduleName.startsWith('./') || moduleName.startsWith('../')) &&
      context.originModulePath
    ) {
      const fromDisk = tryResolveSourceFile(
        path.resolve(path.dirname(context.originModulePath), moduleName)
      );
      if (fromDisk) return fromDisk;
    }
    throw error;
  }
};

module.exports = config;
