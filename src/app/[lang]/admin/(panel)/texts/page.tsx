import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { inputClass, SubmitButton } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDefaultDictionary, getDictionary } from "@/i18n/dictionaries";
import { EDITABLE_SECTIONS, flatten } from "@/i18n/overrides";
import { requireStaff } from "@/server/auth/staff";
import { saveTexts } from "../../_actions/texts";

export default async function TextsPage({ params }: PageProps<"/[lang]/admin/texts">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireStaff(lang, "catalog.content");
  const [adminDict, enNow, arNow, enDef, arDef] = await Promise.all([
    getDictionary(lang),
    getDictionary("en"),
    getDictionary("ar"),
    getDefaultDictionary("en"),
    getDefaultDictionary("ar"),
  ]);
  const t = adminDict.admin;

  return (
    <>
      <PageTitle title={t.texts.title} help={t.texts.help} />
      <div className="space-y-3">
        {EDITABLE_SECTIONS.map((section) => {
          const en = flatten(enNow[section], section);
          const ar = flatten(arNow[section], section);
          const enO = flatten(enDef[section], section);
          const arO = flatten(arDef[section], section);
          const edits = Object.keys(enO).filter((k) => en[k] !== enO[k] || ar[k] !== arO[k]).length;
          return (
            <details key={section} className="border border-line bg-white" data-testid={`texts-${section}`}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 p-4">
                <span className="font-semibold text-green">{t.texts.sections[section]}</span>
                {edits ? (
                  <span className="text-xs text-gold-deep">
                    {edits} {t.texts.edited}
                  </span>
                ) : null}
              </summary>
              <ActionForm action={saveTexts} messages={t.msg} className="space-y-4 border-t border-line p-4">
                <input type="hidden" name="section" value={section} />
                {Object.keys(enO).map((key) => {
                  const rows = Math.min(4, Math.ceil(Math.max(enO[key].length, arO[key].length) / 60));
                  return (
                    <fieldset
                      key={key}
                      className={`grid gap-2 border-b border-line pb-4 sm:grid-cols-2 ${
                        en[key] !== enO[key] || ar[key] !== arO[key] ? "border-s-2 border-s-gold ps-2" : ""
                      }`}
                    >
                      <label className="block">
                        <span className="mb-1 block text-xs text-muted">{t.texts.english}</span>
                        <textarea
                          name={`en:${key}`}
                          defaultValue={en[key]}
                          rows={rows}
                          dir="ltr"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs text-muted">{t.texts.arabic}</span>
                        <textarea
                          name={`ar:${key}`}
                          defaultValue={ar[key]}
                          rows={rows}
                          dir="rtl"
                          className={inputClass}
                        />
                      </label>
                    </fieldset>
                  );
                })}
                <div className="sticky bottom-0 bg-white py-2">
                  <SubmitButton>{t.common.save}</SubmitButton>
                </div>
              </ActionForm>
            </details>
          );
        })}
      </div>
    </>
  );
}
