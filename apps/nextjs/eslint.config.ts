import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@water/eslint-config/base";
import { nextjsConfig } from "@water/eslint-config/nextjs";
import { reactConfig } from "@water/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
