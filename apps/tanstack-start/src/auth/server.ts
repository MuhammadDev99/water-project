import { reactStartCookies } from "better-auth/react-start";

import { initAuth } from "@water/auth";

import { env } from "~/env";
import { getBaseUrl } from "~/lib/url";

export const auth = initAuth({
  baseUrl: getBaseUrl(),
  productionUrl: "turbo.t3.gg",
  secret: env.AUTH_SECRET,
  extraPlugins: [reactStartCookies()],
});
