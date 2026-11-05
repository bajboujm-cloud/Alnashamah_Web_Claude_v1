import { asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { Checkbox, Select, SubmitButton, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { roles } from "@/server/auth/permissions";
import { requireStaff } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";
import { createStaff, resetStaff, updateStaff } from "../../_actions/staff";

export default async function StaffPage({ params }: PageProps<"/[lang]/admin/staff">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await requireStaff(lang, "staff.manage");
  const t = (await getDictionary(lang)).admin;
  const staff = await db.select().from(s.staffUsers).orderBy(asc(s.staffUsers.createdAt));
  const roleOptions = roles.map((r) => ({ value: r, label: t.staff.roles[r] }));
  const date = new Intl.DateTimeFormat(lang === "ar" ? "ar-AE-u-nu-latn" : "en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  });

  return (
    <>
      <PageTitle title={t.staff.title} help={t.staff.roleHelp} />
      <div className="space-y-3">
        {staff.map((u) => (
          <div key={u.id} className="border border-line bg-white p-4" data-testid="staff-row">
            <p className="font-semibold text-green">
              {u.name} {u.id === me.id ? <span className="text-xs text-muted">({t.staff.you})</span> : null}
              {!u.isActive ? <span className="ms-2 text-xs text-danger">{t.staff.disabled}</span> : null}
            </p>
            <p className="text-sm text-muted" dir="ltr">
              {u.email}
            </p>
            <p className="mt-1 text-xs text-muted">
              {u.totpEnabled ? t.staff.twoFactorOn : t.staff.twoFactorOff} · {t.staff.lastLogin}:{" "}
              {u.lastLoginAt ? date.format(u.lastLoginAt) : t.staff.never}
            </p>
            {u.id !== me.id ? (
              <div className="mt-3 flex flex-wrap items-end gap-4 border-t border-line pt-3">
                <ActionForm action={updateStaff} messages={t.msg} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={u.id} />
                  <Select label={t.staff.role} name="role" defaultValue={u.role} options={roleOptions} />
                  <div className="pb-2">
                    <Checkbox label={t.staff.enable} name="isActive" defaultChecked={u.isActive} />
                  </div>
                  <SubmitButton variant="quiet">{t.common.save}</SubmitButton>
                </ActionForm>
                <ActionForm action={resetStaff} messages={{ ...t.msg, saved: t.staff.resetDone }}>
                  <input type="hidden" name="id" value={u.id} />
                  <SubmitButton variant="quiet">{t.staff.resetPassword}</SubmitButton>
                </ActionForm>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <section className="mt-10 border border-dashed border-gold bg-white p-4">
        <h2 className="font-display mb-4 text-lg text-green">{t.staff.add}</h2>
        <ActionForm
          action={createStaff}
          messages={{ ...t.msg, saved: t.staff.created }}
          resetOnSuccess
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label={t.staff.name} name="name" required />
            <TextInput label={t.login.email} name="email" type="email" required dir="ltr" />
            <Select label={t.staff.role} name="role" defaultValue="order_staff" options={roleOptions} />
          </div>
          <SubmitButton>{t.common.add}</SubmitButton>
        </ActionForm>
      </section>
    </>
  );
}
