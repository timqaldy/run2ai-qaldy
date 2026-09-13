import { getRepo } from "@/lib/repo";
import { qrPath } from "@/lib/ticket-svg";

export async function GET() {
  const settings = await (await getRepo()).getSettings();
  if (!settings.qr_active || !settings.kaspi_pay_link) return new Response("Not found", { status: 404 });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#fff"/><path d="${qrPath(settings.kaspi_pay_link, 10, 10, 280)}" fill="#000"/></svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
