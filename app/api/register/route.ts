import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createLead, trackServer } from "@/lib/service";
import { firstError, registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const limited = rateLimit(`register:${getClientIp(request)}`, 6, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, message: "Слишком много попыток. Подождите пару минут." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Не удалось отправить форму" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: firstError(parsed.error) }, { status: 400 });
  }

  try {
    const registration = await createLead(parsed.data);
    await trackServer("registration_completed", { registration: registration.number });
    return NextResponse.json({
      ok: true,
      registration: {
        id: registration.id,
        number: registration.number,
        token: registration.access_token,
        name: registration.name,
        phone: registration.phone,
        status: registration.status,
      },
    });
  } catch (error) {
    console.error("register failed", error);
    return NextResponse.json(
      { ok: false, message: "Сервис временно недоступен. Напишите нам в WhatsApp." },
      { status: 503 },
    );
  }
}
