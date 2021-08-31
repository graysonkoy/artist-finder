module.exports = {
  env: {
    browser: false,
    node: true,
    es2021: true,
  },
  extends: ["plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "no-plusplus": "off",
    "import/no-named-as-default": "off",
    "import/no-named-as-default-member": "off",
    "import/extensions": "off",
    "no-unused-expressions": "off",
    "no-use-before-define": "off",
    "prefer-destructuring": "off",
  },
};
