const eslint = require("@eslint/js");
const plugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  eslint.configs.recommended,
  plugin.configs.recommended,
  plugin.configs.strict,
  plugin.configs.stylistic,
  {
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // extends: "next/core-web-vitals",
    },
  },
];
