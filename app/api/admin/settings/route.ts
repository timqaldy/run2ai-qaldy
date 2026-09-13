import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard";
import { getRepo } from "@/lib/repo";
import { firstError, settingsSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: firstError(parsed.error) }, { status: 400 });
  }
  const repo = await getRepo();
  const [event, settings] = await Promise.all([
    repo.updateEvent(parsed.data.event),
    repo.updateSettings(parsed.data.settings),
  ]);
  return NextResponse.json({ ok: true, event, settings });
}
