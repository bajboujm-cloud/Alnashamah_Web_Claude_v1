import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireStaff } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";

/** Best-effort readable name of the changed item. */
function itemName(after: unknown, before: unknown) {
  const pickName = (v: unknown) =>
    v && typeof v === "object" && "nameEn" in v ? String((v as { nameEn: unknown }).nameEn) : null;
  return pickName(after) ?? pickName(before) ?? "";
}

export default async function AuditPage({ params }: PageProps<"/[lang]/admin/audit">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireStaff(lang, "audit.view");
  const t = (await getDictionary(lang)).admin;
  const rows = await db.select().from(s.auditLog).orderBy(desc(s.auditLog.createdAt)).limit(200);
  const date = new Intl.DateTimeFormat(lang === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  });

  return (
    <>
      <PageTitle title={t.audit.title} help={t.audit.help} />
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-ivory text-start text-xs text-muted">
            <tr>
              <th className="p-2 text-start">{t.audit.when}</th>
              <th className="p-2 text-start">{t.audit.who}</th>
              <th className="p-2 text-start">{t.audit.what}</th>
              <th className="p-2 text-start">{t.audit.item}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap p-2" dir="ltr">
                  {date.format(r.createdAt)}
                </td>
                <td className="p-2" dir="ltr">
                  {r.actor ?? "—"}
                </td>
                <td className="p-2">
                  {r.entity} · {r.action}
                </td>
                <td className="p-2">{itemName(r.after, r.before)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
