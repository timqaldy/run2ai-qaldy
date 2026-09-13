import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions, verifyAdminCredentials } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const limited = rateLimit(`login:${getClientIp(request)}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: "Слишком много попыток. Подождите." }, { status: 429 });
  }
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Проверьте email и пароль" }, { status: 400 });
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { ok: false, message: "Админ-доступ не настроен: задайте ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET" },
      { status: 503 },
    );
  }
  if (!verifyAdminCredentials(parsed.data.email, parsed.data.password)) {
    return NextResponse.json({ ok: false, message: "Неверный email или пароль" }, { status: 401 });
  }
  const cookie = sessionCookieOptions(await createSessionToken(parsed.data.email.toLowerCase()));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, cookie.value, cookie);
  return response;
}
