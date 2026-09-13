import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-guard";
import { ticketMessage } from "@/lib/format";
import { getTicketDelivery } from "@/lib/messaging";
import { getRepo } from "@/lib/repo";
import { confirmPayment, trackServer } from "@/lib/service";
import { adminActionSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const parsed = adminActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Некорректное действие" }, { status: 400 });

  const repo = await getRepo();
  const current = await repo.getRegistration(id);
  if (!current) return NextResponse.json({ ok: false, message: "Заявка не найдена" }, { status: 404 });

  const action = parsed.data;
  let registration = current;
  let whatsappUrl: string | null = null;

  if (action.action === "confirm_payment") {
    registration = (await confirmPayment(id)) ?? current;
  } else if (action.action === "mark_ticket_sent") {
    if (!current.ticket_url) {
      return NextResponse.json({ ok: false, message: "Сначала подтвердите оплату" }, { status: 409 });
    }
    const [event, settings] = await Promise.all([repo.getEvent(), repo.getSettings()]);
    const delivery = await getTicketDelivery().deliver({
      phone: current.whatsapp,
      message: ticketMessage(event, settings, current),
    });
    if (delivery.mode === "manual_link") whatsappUrl = delivery.url;
    registration = (await repo.updateRegistration(id, { status: "ticket_sent" })) ?? current;
    trackServer("ticket_sent", { registration: current.number, mode: delivery.mode });
  } else if (action.action === "set_status") {
    const paidLike = action.status === "paid" || action.status === "ticket_sent";
    if (paidLike && !current.ticket_url) {
      registration = (await confirmPayment(id)) ?? current;
      if (action.status === "ticket_sent") {
        registration = (await repo.updateRegistration(id, { status: "ticket_sent" })) ?? registration;
      }
    } else {
      const payment_status =
        action.status === "paid" || action.status === "ticket_sent"
          ? "paid"
          : action.status === "waiting_payment" || action.status === "receipt_received"
            ? "pending"
            : action.status === "cancelled" && current.payment_status === "paid"
              ? "refunded"
              : current.payment_status === "paid"
                ? "paid"
                : "unpaid";
      registration =
        (await repo.updateRegistration(id, { status: action.status, payment_status })) ?? current;
    }
  } else {
    registration = (await repo.updateRegistration(id, { notes: action.notes })) ?? current;
  }

  return NextResponse.json({ ok: true, registration, whatsappUrl });
}
