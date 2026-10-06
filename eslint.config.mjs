import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 글과 Obsidian vault 설정(.obsidian/plugins의 빌드된 플러그인 코드 포함). 코드가 아니라 검사하지 않는다
    "content/**",
    // Velite 생성물
    ".velite/**",
  ]),
]);

export default eslintConfig;
