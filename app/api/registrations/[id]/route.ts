import { NextResponse } from "next/server";
import { getRepo } from "@/lib/repo";
import { trackServer } from "@/lib/service";
import { publicEventSchema } from "@/lib/validation";

async function authorized(id: string, token: string | null) {
  if (!token) return null;
  const repo = await getRepo();
  const registration = await repo.getRegistration(id);
  if (!registration || registration.access_token !== token) return null;
  return { repo, registration };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await authorized(id, new URL(request.url).searchParams.get("token"));
  if (!found) return NextResponse.json({ ok: false }, { status: 404 });
  const r = found.registration;
  return NextResponse.json({
    ok: true,
    registration: {
      id: r.id,
      number: r.number,
      token: r.access_token,
      name: r.name,
      phone: r.phone,
      status: r.status,
      ticket_url: r.status === "paid" || r.status === "ticket_sent" ? r.ticket_url : null,
    },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = publicEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const found = await authorized(id, parsed.data.token);
  if (!found) return NextResponse.json({ ok: false }, { status: 404 });
  const { repo, registration } = found;

  if (parsed.data.event === "payment_screen_opened" && registration.status === "new") {
    await repo.updateRegistration(id, { status: "waiting_payment", payment_status: "pending" });
  }
  if (parsed.data.event === "whatsapp_receipt_click") {
    await repo.updateRegistration(id, { receipt_clicked_at: new Date().toISOString() });
  }
  trackServer(parsed.data.event, { registration: registration.number });
  return NextResponse.json({ ok: true });
}
