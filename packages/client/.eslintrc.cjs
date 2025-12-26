module.exports = {
  extends: ["next/core-web-vitals"],
  overrides: [
    {
      files: ["cypress/**", "**/*.config.ts"],
      rules: {
        "@next/next/no-html-link-for-pages": "off",
      },
    },
  ],
};
