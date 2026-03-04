import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const CATALOG_S3_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663337257885/g9FMjJFMH7rkmYiPvT29tr/cerad-catalog/catalog.json";

let catalogCache: { data: string; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Image proxy endpoint will be registered in Express directly
export function getImageProxyUrl(fileId: string): string {
  return `/api/image-proxy/${fileId}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  catalog: router({
    getData: publicProcedure.query(async () => {
      // Return cached data if fresh
      if (catalogCache && Date.now() - catalogCache.timestamp < CACHE_TTL) {
        return JSON.parse(catalogCache.data);
      }
      // Fetch from S3 (CloudFront CDN)
      const response = await fetch(CATALOG_S3_URL);
      if (!response.ok) throw new Error(`Failed to fetch catalog: ${response.status}`);
      const text = await response.text();
      catalogCache = { data: text, timestamp: Date.now() };
      return JSON.parse(text);
    }),
  }),
});

export type AppRouter = typeof appRouter;
