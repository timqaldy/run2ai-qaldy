import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard";
import { getRepo } from "@/lib/repo";
import { uploadKey, validateImage } from "@/lib/uploads";

const SETTING_FOR_KIND = { qr: "kaspi_qr_key", hero: "hero_image_key" } as const;
type Kind = keyof typeof SETTING_FOR_KIND | "testimonial";

function readKind(value: unknown): Kind | null {
  return value === "qr" || value === "hero" || value === "testimonial" ? value : null;
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const form = await request.formData().catch(() => null);
  const kind = readKind(form?.get("kind"));
  if (!form || !kind) return NextResponse.json({ ok: false, message: "Некорректный запрос" }, { status: 400 });

  const image = await validateImage(form.get("file"));
  if ("error" in image) return NextResponse.json({ ok: false, message: image.error }, { status: 400 });

  const repo = await getRepo();
  const key = uploadKey(kind, image.ext);
  await repo.putFile(key, image.bytes, image.contentType);

  if (kind !== "testimonial") {
    const field = SETTING_FOR_KIND[kind];
    const previous = (await repo.getSettings())[field];
    const settings = await repo.updateSettings({ [field]: key });
    if (previous) await repo.deleteFile(previous).catch(() => undefined);
    return NextResponse.json({ ok: true, key, settings });
  }
  return NextResponse.json({ ok: true, key });
}

export async function DELETE(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const kind = readKind(new URL(request.url).searchParams.get("kind"));
  if (!kind || kind === "testimonial") {
    return NextResponse.json({ ok: false, message: "Некорректный запрос" }, { status: 400 });
  }
  const repo = await getRepo();
  const field = SETTING_FOR_KIND[kind];
  const previous = (await repo.getSettings())[field];
  const settings = await repo.updateSettings({ [field]: null });
  if (previous) await repo.deleteFile(previous).catch(() => undefined);
  return NextResponse.json({ ok: true, settings });
}
