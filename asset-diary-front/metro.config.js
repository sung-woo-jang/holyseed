const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-svg가 @granite-js/native/node_modules 안에도 존재해 이중 등록 에러 발생.
// 루트 node_modules의 단일 복사본을 사용하도록 강제한다.
config.resolver = config.resolver ?? {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-svg': path.resolve(__dirname, 'node_modules/react-native-svg'),
};

module.exports = config;
