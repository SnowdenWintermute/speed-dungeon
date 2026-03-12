module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: [
      "./packages/*/tsconfig.json"
    ],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/stylistic",
  ],
  rules: {
    "react/no-unescaped-entities": "off",
    "no-unused-expressions": "off",
    "@typescript-eslint/no-extraneous-class": "off",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/no-unused-expressions": "error",
    "@typescript-eslint/no-dynamic-delete":"off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-explicit-any":"off",
    "@typescript-eslint/no-this-alias":"off",
    "@typescript-eslint/unified-signatures":"off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "args": "all",
        "argsIgnorePattern": "^_",
        "caughtErrors": "all",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      },]
  },
};
