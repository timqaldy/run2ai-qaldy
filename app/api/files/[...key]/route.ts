import { getRepo } from "@/lib/repo";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const path = key.join("/");
  if (!/^public\/[a-zA-Z0-9._-]+$/.test(path)) return new Response("Not found", { status: 404 });

  const file = await (await getRepo()).getFile(path);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
