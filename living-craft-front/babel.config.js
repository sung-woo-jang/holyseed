module.exports = {
  presets: ['babel-preset-granite'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@components': './src/components',
          '@hooks': './src/hooks',
          '@api': './src/api',
          '@store': './src/store',
          '@types': './src/types',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@contexts': './src/contexts',
          '@mocks': './src/mocks',
        },
      },
    ],
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        blocklist: null,
        allowlist: null,
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
  ],
};
