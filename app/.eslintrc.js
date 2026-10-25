module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
      rules: {
        'no-console': 'error',
        'no-restricted-properties': [
          'error',
          {
            object: 'Math',
            property: 'random',
            message:
              'Math.random is not a cryptographically secure source; use the RNGetRandomValues native module validated in Stage 02.',
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native-get-random-values',
                message:
                  'The package entry point contains an insecure Math.random fallback; call the RNGetRandomValues native module directly.',
              },
            ],
          },
        ],
      },
    },
  ],
};
