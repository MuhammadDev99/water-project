import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@water/auth";

import { env } from "~/env";


export const auth = initAuth({
  baseUrl: "http://localhost:3000",
  productionUrl: `https://turbo.t3.gg`,
  secret: env.AUTH_SECRET,
  extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
