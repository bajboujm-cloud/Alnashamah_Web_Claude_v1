import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { Checkbox, SubmitButton, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireStaff } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";
import { SETTING_KEYS } from "@/server/settings";
import { saveSettings } from "../../_actions/catalog";

export default async function SettingsPage({ params }: PageProps<"/[lang]/admin/settings">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireStaff(lang, "settings.edit");
  const t = (await getDictionary(lang)).admin;
  const rows = await db.select().from(s.settings);
  const value = (k: string) => rows.find((r) => r.key === k)?.value;

  return (
    <>
      <PageTitle title={t.settings.title} help={t.settings.help} />
      <ActionForm
        action={saveSettings}
        messages={t.msg}
        className="space-y-4 border border-line bg-white p-4 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTING_KEYS.map((key) =>
            key === "tax.prices_include_vat" ? (
              <div key={key} className="pt-6">
                <Checkbox label={t.settings.fields[key]} name={key} defaultChecked={value(key) !== false} />
              </div>
            ) : (
              <TextInput
                key={key}
                label={t.settings.fields[key]}
                name={key}
                defaultValue={String(value(key) ?? "")}
                dir={key.endsWith("_ar") ? "rtl" : "ltr"}
              />
            ),
          )}
        </div>
        <SubmitButton>{t.common.save}</SubmitButton>
      </ActionForm>
    </>
  );
}
