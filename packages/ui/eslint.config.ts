import { defineConfig } from "eslint/config";

import { baseConfig } from "@water/eslint-config/base";
import { reactConfig } from "@water/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
