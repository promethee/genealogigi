import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src-tauri/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  vue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    // vue-tsc already reports undefined names, with correct DOM globals.
    rules: { "no-undef": "off" },
  },
  { rules: { "@typescript-eslint/no-explicit-any": "error" } },
  {
    // Node scripts of the real-app test suite.
    files: ["real-app/**/*.mjs"],
    languageOptions: {
      globals: { process: "readonly", fetch: "readonly", setTimeout: "readonly" },
    },
  },
);
