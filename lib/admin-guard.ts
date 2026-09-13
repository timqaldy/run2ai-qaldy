import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ ok: false, message: "Требуется вход" }, { status: 401 }),
    };
  }
  return { session, response: null };
}
