import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminSession } from "@/lib/auth";
import { getRepo } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Заявки — админка", robots: { index: false } };

export default async function AdminPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const repo = await getRepo();
  const [registrations, event, settings] = await Promise.all([
    repo.listRegistrations(),
    repo.getEvent(),
    repo.getSettings(),
  ]);
  return (
    <>
      <AdminNav active="leads" />
      <AdminDashboard initial={registrations} event={event} settings={settings} storage={repo.kind} />
    </>
  );
}
