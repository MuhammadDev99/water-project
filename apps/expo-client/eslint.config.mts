import { defineConfig } from "eslint/config";

import { baseConfig } from "@water/eslint-config/base";
import { reactConfig } from "@water/eslint-config/react";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
