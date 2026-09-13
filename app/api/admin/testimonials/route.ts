import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard";
import { getRepo } from "@/lib/repo";
import { firstError, testimonialSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = testimonialSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: firstError(parsed.error) }, { status: 400 });
  }
  const repo = await getRepo();
  const existing = parsed.data.id
    ? (await repo.listTestimonials(false)).find((t) => t.id === parsed.data.id)
    : undefined;
  const photoKey = parsed.data.photo_key ?? null;
  if (photoKey && !photoKey.startsWith("public/testimonial-")) {
    return NextResponse.json({ ok: false, message: "Некорректное фото" }, { status: 400 });
  }
  const item = await repo.saveTestimonial({
    id: existing?.id ?? crypto.randomUUID(),
    name: parsed.data.name,
    quote: parsed.data.quote,
    rating: parsed.data.rating,
    published: parsed.data.published,
    photo_key: photoKey,
    created_at: existing?.created_at ?? new Date().toISOString(),
  });
  if (existing?.photo_key && existing.photo_key !== photoKey) {
    await repo.deleteFile(existing.photo_key).catch(() => undefined);
  }
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const repo = await getRepo();
  const existing = (await repo.listTestimonials(false)).find((t) => t.id === id);
  await repo.deleteTestimonial(id);
  if (existing?.photo_key) await repo.deleteFile(existing.photo_key).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
