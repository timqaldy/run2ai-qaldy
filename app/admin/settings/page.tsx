import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getAdminSession } from "@/lib/auth";
import { getRepo } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Настройки — админка", robots: { index: false } };

export default async function SettingsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const repo = await getRepo();
  const [event, settings, testimonials] = await Promise.all([
    repo.getEvent(),
    repo.getSettings(),
    repo.listTestimonials(false),
  ]);
  return (
    <>
      <AdminNav active="settings" />
      <SettingsForm event={event} settings={settings} testimonials={testimonials} />
    </>
  );
}
