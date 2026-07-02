const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

/** Zustand's ESM build uses import.meta.env, which breaks Expo web (classic script bundle). */
const ZUSTAND_CJS_ON_WEB = {
  zustand: 'zustand/index.js',
  'zustand/vanilla': 'zustand/vanilla.js',
  'zustand/react': 'zustand/react.js',
  'zustand/middleware': 'zustand/middleware.js',
  'zustand/shallow': 'zustand/shallow.js',
  'zustand/traditional': 'zustand/traditional.js',
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const cjsEntry = ZUSTAND_CJS_ON_WEB[moduleName];
    if (cjsEntry) {
      return {
        filePath: path.resolve(__dirname, 'node_modules', cjsEntry),
        type: 'sourceFile',
      };
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
