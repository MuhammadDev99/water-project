import { serve } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { appRouter, createTRPCContext } from "@water/api";
import { initAuth } from "@water/auth";
import "dotenv/config";

const app = new Hono();

// 1. Setup Auth
// Note: We don't use nextCookies() here because this is a standard Hono/Node server
const auth = initAuth({
    baseUrl: process.env.AUTH_URL ?? "http://localhost:3001",
    secret: process.env.AUTH_SECRET!,
    productionUrl: process.env.PRODUCTION_URL ?? "https://your-production-url.com",
});

// 2. Middleware
app.use("*", logger());
app.use(
    "*",
    cors({
        origin: (origin) => origin,
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization", "x-trpc-source", "cookie"],
        credentials: true,
    })
);

// 3. Better-Auth Handler
// Better-Auth handles its own routing via the .handler method
app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

// 4. tRPC Handler
app.all("/api/trpc/*", (c) => {
    return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: c.req.raw, // Hono request to standard Web Request
        router: appRouter,
        createContext: () =>
            createTRPCContext({
                auth,
                headers: c.req.raw.headers,
            }),
        onError({ error, path }) {
            console.error(`>>> tRPC Error on '${path}'`, error);
        },
    });
});

const port = 3001;
console.log(`🚀 Hono API running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port,
});

export type AppType = typeof app;