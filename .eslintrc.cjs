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
    "@next/next/no-img-element":"off",
    "@typescript-eslint/no-empty-function":"off",
    "@typescript-eslint/consistent-indexed-object-style":"off",
    "react/no-unescaped-entities": "off",
    "no-unused-expressions": "off",
    "@typescript-eslint/no-extraneous-class": "off",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "no-restricted-imports": "off",
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@speed-dungeon/common/src", "@speed-dungeon/common/src/*"],
            message:
              "import from \"@speed-dungeon/common\". a /src/ path bypasses dist and pulls raw .ts into the bundler build, which fails to resolve common's .js specifiers. if the symbol is missing, export it from common/src/index.ts.",
          },
        ],
      },
    ],
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
