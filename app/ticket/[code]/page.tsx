import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteUrl } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import { ticketSvg } from "@/lib/ticket-svg";
import { TicketActions } from "./TicketActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Билет — Пробежка по ИИ-шкам", robots: { index: false } };

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^RUN-[A-Z0-9]{10}$/.test(code)) notFound();

  const repo = await getRepo();
  const ticket = await repo.getTicketByCode(code);
  if (!ticket) notFound();
  const [registration, event] = await Promise.all([repo.getRegistration(ticket.registration_id), repo.getEvent()]);
  const valid = registration?.status === "paid" || registration?.status === "ticket_sent";
  const svg = ticketSvg({ event, ticket, url: `${siteUrl()}/ticket/${ticket.code}`, valid });

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-4 py-8">
      <div
        className="w-full overflow-hidden rounded-[2rem] shadow-[0_0_60px_rgba(0,174,239,.25)] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {valid ? (
        <TicketActions code={ticket.code} />
      ) : (
        <p className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center text-red-200">
          Этот билет недействителен. Напишите организаторам в WhatsApp.
        </p>
      )}
      <Link href="/" className="no-print mt-6 text-sm text-mist underline">
        На главную
      </Link>
    </main>
  );
}
