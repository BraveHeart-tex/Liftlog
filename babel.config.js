module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['inline-import', { extensions: ['.sql'] }],
      'react-native-reanimated/plugin'
    ],
    env: {
      // Jest sets NODE_ENV=test; app builds never load these plugins.
      test: {
        plugins: [
          './tests/import-meta.babel.js',
          './tests/dynamic-import.babel.js'
        ]
      }
    }
  };
};
