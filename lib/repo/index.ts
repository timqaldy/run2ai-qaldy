import { createD1Repo, type D1Like, type R2Like } from "./d1";
import { createSupabaseRepo, isSupabaseConfigured } from "./supabase";
import type { Repo } from "./types";

export type { Repo } from "./types";

export async function getRepo(): Promise<Repo> {
  if (isSupabaseConfigured()) return createSupabaseRepo();

  const useBindings = process.env.NODE_ENV === "production" || process.env.DEV_USE_BINDINGS === "1";
  if (useBindings) try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const bindings = env as { DB?: D1Like; FILES?: R2Like };
    if (bindings.DB) return createD1Repo(bindings.DB, bindings.FILES);
  } catch {
    // Plain `next dev` without Workers bindings.
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_STORE !== "1" && isWorkerRuntime()) {
    throw new Error("No database configured: set Supabase env or bind D1 as DB");
  }

  const { createLocalRepo } = await import("./local");
  return createLocalRepo();
}

function isWorkerRuntime() {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}
