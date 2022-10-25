module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['plugin:react/recommended', 'airbnb', 'prettier'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    'react/prefer-stateless-function': 'off',
    'react/jsx-filename-extension': [1, {extensions: ['.js']}],
    'react/jsx-props-no-spreading': 'off',
  },
};
