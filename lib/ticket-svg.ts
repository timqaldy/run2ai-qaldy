import QRCode from "qrcode";
import { formatDate } from "@/lib/format";
import type { EventInfo, Ticket } from "@/types";

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function qrPath(text: string, x: number, y: number, size: number) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const cell = size / count;
  let d = "";
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.modules.get(row, col)) {
        d += `M${(x + col * cell).toFixed(2)} ${(y + row * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
      }
    }
  }
  return d;
}

export function ticketSvg(input: { event: EventInfo; ticket: Ticket; url: string; valid: boolean }) {
  const { event, ticket, url, valid } = input;
  const W = 720;
  const H = 1080;
  const font = "Arial Black, Arial, Helvetica, sans-serif";
  const body = "Arial, Helvetica, sans-serif";
  const name = ticket.holder_name.length > 26 ? `${ticket.holder_name.slice(0, 25)}…` : ticket.holder_name;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Билет ${esc(ticket.code)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#041526"/><stop offset="1" stop-color="#020814"/></linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00AEEF"/><stop offset="1" stop-color="#00D4FF"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="40" fill="url(#bg)"/>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="36" fill="none" stroke="#00D4FF" stroke-opacity=".55" stroke-width="3"/>
  <text x="56" y="120" font-family="${font}" font-size="54" font-weight="900" font-style="italic" fill="#fff">ПРОБЕЖКА</text>
  <text x="56" y="182" font-family="${font}" font-size="54" font-weight="900" font-style="italic" fill="#fff">ПО ИИ-ШКАМ</text>
  <path d="M56 204c120-14 330-18 520-8-150 10-340 14-520 22z" fill="url(#glow)"/>
  <text x="56" y="272" font-family="${font}" font-size="46" font-weight="900" font-style="italic" fill="#00D4FF">${esc(event.event_type.toUpperCase())}</text>
  <text x="56" y="360" font-family="${body}" font-size="22" fill="#9FB6CC" letter-spacing="3">УЧАСТНИК</text>
  <text x="56" y="404" font-family="${font}" font-size="40" font-weight="900" fill="#fff">${esc(name)}</text>
  <text x="56" y="480" font-family="${body}" font-size="22" fill="#9FB6CC" letter-spacing="3">ДАТА</text>
  <text x="56" y="524" font-family="${font}" font-size="40" font-weight="900" fill="#fff">${esc(formatDate(event.date))}</text>
  <text x="420" y="480" font-family="${body}" font-size="22" fill="#9FB6CC" letter-spacing="3">ВРЕМЯ</text>
  <text x="420" y="524" font-family="${font}" font-size="40" font-weight="900" fill="#fff">${esc(event.time)}</text>
  <line x1="40" y1="580" x2="${W - 40}" y2="580" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-dasharray="14 12"/>
  <rect x="56" y="620" width="300" height="300" rx="20" fill="#fff"/>
  <path d="${qrPath(url, 76, 640, 260)}" fill="#020814"/>
  <text x="392" y="660" font-family="${body}" font-size="22" fill="#9FB6CC" letter-spacing="3">TICKET ID</text>
  <text x="392" y="702" font-family="${font}" font-size="28" font-weight="900" fill="#fff">${esc(ticket.code)}</text>
  <text x="392" y="780" font-family="${body}" font-size="22" fill="#9FB6CC" letter-spacing="3">СТАТУС</text>
  <rect x="392" y="800" width="${valid ? 150 : 250}" height="64" rx="16" fill="${valid ? "#00AEEF" : "#7f1d1d"}"/>
  <text x="${valid ? 467 : 517}" y="844" text-anchor="middle" font-family="${font}" font-size="30" font-weight="900" fill="${valid ? "#020814" : "#fff"}">${valid ? "PAID" : "НЕДЕЙСТВИТЕЛЕН"}</text>
  <text x="56" y="990" font-family="${body}" font-size="22" fill="#9FB6CC">Адрес: ${esc(event.address)}</text>
  <text x="56" y="1030" font-family="${body}" font-size="20" fill="#9FB6CC" fill-opacity=".7">${esc(event.organizers)} · QALDY AI</text>
</svg>`;
}
