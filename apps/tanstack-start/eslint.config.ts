import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@water/eslint-config/base";
import { reactConfig } from "@water/eslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
