import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@water/eslint-config/base";

export default defineConfig(
  {
    ignores: ["script/**"],
  },
  baseConfig,
  restrictEnvAccess,
);
