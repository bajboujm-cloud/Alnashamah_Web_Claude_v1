import { notFound } from "next/navigation";
import { SimpleItems } from "@/components/admin/SimpleItems";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireStaff } from "@/server/auth/staff";

export default async function Page({ params }: PageProps<"/[lang]/admin/packaging">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang, "catalog.content");
  const t = (await getDictionary(lang)).admin;
  return <SimpleItems kind="packaging" lang={lang} t={t} role={user.role} />;
}
