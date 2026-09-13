import { getRepo } from "@/lib/repo";

export async function capturePosthog(event: string, distinctId: string, properties: Record<string, string>) {
  try {
    const settings = await (await getRepo()).getSettings();
    const key = process.env.POSTHOG_KEY || settings.posthog_key;
    if (!key) return;
    const host = process.env.POSTHOG_HOST || settings.posthog_host;
    await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: "run2ai-server" },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (error) {
    console.error("posthog capture failed", error);
  }
}
