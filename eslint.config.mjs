import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // These are advisory rules and currently trigger on several template-mount
      // patterns that are intentional in this codebase.
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Windows/zip/exFAT metadata artifacts (can break ESLint parsing).
    "**/._*",
    "._*",

    // Vendored/minified assets.
    "public/**/*.min.js",
    "public/js/**",
    "public/icons/**",
  ]),
]);

export default eslintConfig;
