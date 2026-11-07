import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Checkbox, Select, SubmitButton, TextArea, TextInput } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/ImageField";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale, pick, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/dictionaries";
import { can } from "@/server/auth/permissions";
import { requireStaff } from "@/server/auth/staff";
import { adminBreedsByCategory } from "@/server/admin-data";
import { db } from "@/server/db";
import { Switch } from "@/components/admin/Switch";
import {
  deleteSeasonal,
  saveSeasonal,
  setSeasonalExtrasAllowed,
  setSeasonalVisible,
} from "../../_actions/catalog";

const day = (d: Date | null) => (d ? new Date(d.getTime() + 4 * 3_600_000).toISOString().slice(0, 10) : ""); // UAE date

type Season = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  illustrationUrl: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  occasion: string;
  noExtras: boolean;
  noExtrasNoteEn: string;
  noExtrasNoteAr: string;
  breedIds: string[];
};
type Cats = Awaited<ReturnType<typeof adminBreedsByCategory>>;

function SeasonForm({
  lang,
  t,
  c,
  cats,
  full,
  occasionLabels,
}: {
  lang: Locale;
  t: Dictionary["admin"];
  c: Season | null;
  cats: Cats;
  full: boolean;
  /** Occasion value → label in the admin's language. */
  occasionLabels: Record<string, string>;
}) {
  return (
    <ActionForm action={saveSeasonal} messages={t.msg} resetOnSuccess={!c} className="space-y-4">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={t.common.nameEn} name="nameEn" defaultValue={c?.nameEn} required dir="ltr" />
        <TextInput label={t.common.nameAr} name="nameAr" defaultValue={c?.nameAr} required dir="rtl" />
        <TextArea
          label={t.common.descriptionEn}
          name="descriptionEn"
          defaultValue={c?.descriptionEn}
          dir="ltr"
        />
        <TextArea
          label={t.common.descriptionAr}
          name="descriptionAr"
          defaultValue={c?.descriptionAr}
          dir="rtl"
        />
        {full ? (
          <>
            <TextInput
              label={t.common.slug}
              hint={t.common.slugHelp}
              name="slug"
              defaultValue={c?.slug}
              required
              dir="ltr"
            />
            <div className="pt-6">
              <Checkbox label={t.seasonal.active} name="isActive" defaultChecked={c?.isActive ?? false} />
            </div>
            <TextInput
              label={t.seasonal.startsAt}
              name="startsAt"
              type="date"
              defaultValue={day(c?.startsAt ?? null)}
            />
            <TextInput
              label={t.seasonal.endsAt}
              name="endsAt"
              type="date"
              defaultValue={day(c?.endsAt ?? null)}
            />
            <Select
              label={t.seasonal.occasion}
              name="occasion"
              defaultValue={c?.occasion ?? "none"}
              options={Object.entries(occasionLabels).map(([value, label]) => ({ value, label }))}
            />
          </>
        ) : null}
      </div>
      {full ? (
        <div className="space-y-3 border border-gold/50 bg-ivory/50 p-3" data-testid="no-extras-rule">
          <Checkbox label={t.seasonal.noExtras} name="noExtras" defaultChecked={c?.noExtras ?? false} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label={t.seasonal.noExtrasNoteEn}
              name="noExtrasNoteEn"
              defaultValue={c?.noExtrasNoteEn ?? ""}
              dir="ltr"
            />
            <TextInput
              label={t.seasonal.noExtrasNoteAr}
              name="noExtrasNoteAr"
              defaultValue={c?.noExtrasNoteAr ?? ""}
              dir="rtl"
            />
          </div>
        </div>
      ) : null}
      {full ? (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-muted">{t.seasonal.eligible}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cats.flatMap((cat) =>
              cat.breeds.map((b) => (
                <Checkbox
                  key={b.id}
                  name="breedIds"
                  value={b.id}
                  defaultChecked={c?.breedIds.includes(b.id) ?? false}
                  label={`${pick(lang, b.nameEn, b.nameAr)} · ${pick(lang, cat.nameEn, cat.nameAr)}`}
                />
              )),
            )}
          </div>
        </fieldset>
      ) : null}
      <ImageField
        label={t.common.illustration}
        hint={t.common.uploadSvgHelp}
        name="illustration"
        current={c?.illustrationUrl ?? null}
        removeLabel={t.common.removeImage}
        accept="image/svg+xml,image/jpeg,image/png,image/webp"
      />
      <SubmitButton>{c ? t.common.save : t.common.add}</SubmitButton>
    </ActionForm>
  );
}

export default async function SeasonalAdminPage({ params }: PageProps<"/[lang]/admin/seasonal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang, "catalog.content");
  const dict = await getDictionary(lang);
  const t = dict.admin;
  const full = can(user.role, "catalog.prices");
  const [cats, rows] = await Promise.all([
    adminBreedsByCategory(),
    db.query.seasonalCollections.findMany({
      with: { breeds: { columns: { breedId: true } } },
      orderBy: (c, { asc }) => [asc(c.sortOrder)],
    }),
  ]);
  const seasons: Season[] = rows.map((r) => ({ ...r, breedIds: r.breeds.map((b) => b.breedId) }));

  return (
    <>
      <PageTitle title={t.seasonal.title} />
      <div className="space-y-4">
        {seasons.map((c) => (
          <div
            key={c.id}
            className={`flex items-start gap-3 border bg-white p-1 ${c.isActive ? "border-line" : "border-danger/40"}`}
            data-testid="admin-seasonal"
          >
            <details className="min-w-0 flex-1">
              <summary className="cursor-pointer p-3 font-semibold text-green">
                {pick(lang, c.nameEn, c.nameAr)}
              </summary>
              <div className="border-t border-line p-4">
                <SeasonForm
                  lang={lang}
                  t={t}
                  c={c}
                  cats={cats}
                  full={full}
                  occasionLabels={dict.order.occasions}
                />
                {full ? (
                  <ActionForm
                    action={deleteSeasonal}
                    messages={t.msg}
                    className="mt-4 border-t border-line pt-4"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmButton question={t.common.confirmDelete}>{t.common.delete}</ConfirmButton>
                  </ActionForm>
                ) : null}
              </div>
            </details>
            {full ? (
              <div className="flex shrink-0 flex-col items-start p-2">
                <Switch
                  checked={c.isActive}
                  label={`${pick(lang, c.nameEn, c.nameAr)} — ${t.common.visibilityHint}`}
                  onLabel={t.common.shown}
                  offLabel={t.common.hiddenLabel}
                  action={setSeasonalVisible.bind(null, c.id)}
                  testId="visibility-switch"
                />
                <Switch
                  checked={!c.noExtras}
                  label={`${pick(lang, c.nameEn, c.nameAr)} — ${t.seasonal.noExtras}`}
                  onLabel={t.seasonal.extrasAllowed}
                  offLabel={t.seasonal.extrasBlocked}
                  action={setSeasonalExtrasAllowed.bind(null, c.id)}
                  testId="no-extras-switch"
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {full ? (
        <section className="mt-10 border border-dashed border-gold bg-white p-4">
          <h2 className="font-display mb-4 text-lg text-green">{t.seasonal.newTitle}</h2>
          <SeasonForm lang={lang} t={t} c={null} cats={cats} full occasionLabels={dict.order.occasions} />
        </section>
      ) : null}
    </>
  );
}
