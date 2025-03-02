module.exports = {
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@next/next/recommended',
    ],
    parser: 'babel-eslint',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 12,
      sourceType: 'module',
    },
    plugins: ['react'],
    rules: {
      'react/no-unescaped-entities': 'off', // Disable the rule
      'react/prop-types': 'off', // Example of disabling another rule
      // Add other rules you want to disable here
    },
  };