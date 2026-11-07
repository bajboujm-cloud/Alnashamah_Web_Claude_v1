import { asc } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { pick } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatAed } from "@/lib/format";
import { deleteSimple, saveSimple, setSimpleAvailable } from "@/app/[lang]/admin/_actions/catalog";
import { can, type Role } from "@/server/auth/permissions";
import { db, schema as s } from "@/server/db";
import { ActionForm } from "./ActionForm";
import { ConfirmButton } from "./ConfirmButton";
import { Checkbox, SubmitButton, TextArea, TextInput } from "./fields";
import { ImageField } from "./ImageField";
import { PageTitle } from "./PageTitle";
import { Switch } from "./Switch";

type Kind = "cutting" | "extras" | "packaging";
type Item = {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  photoUrl?: string | null;
  videoUrl?: string | null;
  priceFils: number;
  selectedByDefault?: boolean;
  isAvailable: boolean;
};

async function load(kind: Kind): Promise<Item[]> {
  if (kind === "cutting") return db.select().from(s.cuttingOptions).orderBy(asc(s.cuttingOptions.sortOrder));
  if (kind === "extras") return db.select().from(s.extras).orderBy(asc(s.extras.sortOrder));
  return db.select().from(s.packagingOptions).orderBy(asc(s.packagingOptions.sortOrder));
}

function ItemForm({
  kind,
  t,
  item,
  full,
}: {
  kind: Kind;
  t: Dictionary["admin"];
  item: Item | null;
  full: boolean;
}) {
  return (
    <ActionForm action={saveSimple} messages={t.msg} resetOnSuccess={!item} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={t.common.nameEn} name="nameEn" defaultValue={item?.nameEn} required dir="ltr" />
        <TextInput label={t.common.nameAr} name="nameAr" defaultValue={item?.nameAr} required dir="rtl" />
        {kind !== "extras" ? (
          <>
            <TextArea
              label={t.common.descriptionEn}
              name="descriptionEn"
              defaultValue={item?.descriptionEn}
              dir="ltr"
            />
            <TextArea
              label={t.common.descriptionAr}
              name="descriptionAr"
              defaultValue={item?.descriptionAr}
              dir="rtl"
            />
          </>
        ) : null}
        {full ? (
          <TextInput
            label={t.common.priceAed}
            name="priceAed"
            defaultValue={item ? String(item.priceFils / 100) : "0"}
            inputMode="decimal"
            required
            dir="ltr"
          />
        ) : null}
        {kind === "cutting" ? (
          <TextInput
            label={t.simple.videoUrl}
            name="videoUrl"
            type="url"
            defaultValue={item?.videoUrl ?? ""}
            dir="ltr"
          />
        ) : null}
        {kind === "extras" && full ? (
          <div className="pt-6">
            <Checkbox
              label={t.simple.defaultSelected}
              name="selectedByDefault"
              defaultChecked={item?.selectedByDefault ?? false}
            />
          </div>
        ) : null}
      </div>
      {kind !== "extras" ? (
        <ImageField
          label={t.common.photo}
          hint={t.common.uploadHelp}
          name="photo"
          current={item?.photoUrl ?? null}
          removeLabel={t.common.removeImage}
        />
      ) : null}
      <SubmitButton>{item ? t.common.save : t.common.add}</SubmitButton>
    </ActionForm>
  );
}

/** Shared admin screen for cutting options, "order includes" extras and packaging. */
export async function SimpleItems({
  kind,
  lang,
  t,
  role,
}: {
  kind: Kind;
  lang: Locale;
  t: Dictionary["admin"];
  role: Role;
}) {
  const items = await load(kind);
  const full = can(role, "catalog.prices");
  const canToggle = can(role, "stock.toggle");
  const title = {
    cutting: t.simple.cuttingTitle,
    extras: t.simple.extrasTitle,
    packaging: t.simple.packagingTitle,
  }[kind];
  const help = {
    cutting: t.simple.cuttingHelp,
    extras: t.simple.extrasHelp,
    packaging: t.simple.packagingHelp,
  }[kind];

  return (
    <>
      <PageTitle title={title} help={help} />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border border-line bg-white" data-testid="simple-item">
            <div className="flex items-center gap-3 p-3">
              <details className="min-w-0 flex-1">
                <summary className="cursor-pointer">
                  <span className="font-semibold text-green">{pick(lang, item.nameEn, item.nameAr)}</span>{" "}
                  <span className="text-sm text-muted">
                    · {item.priceFils === 0 ? t.common.free : formatAed(item.priceFils, lang)}
                  </span>
                </summary>
                <div className="mt-3 border-t border-line pt-3">
                  <ItemForm kind={kind} t={t} item={item} full={full} />
                  {full ? (
                    <ActionForm
                      action={deleteSimple}
                      messages={t.msg}
                      className="mt-4 border-t border-line pt-4"
                    >
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmButton question={t.common.confirmDelete}>{t.common.delete}</ConfirmButton>
                    </ActionForm>
                  ) : null}
                </div>
              </details>
              {canToggle ? (
                <Switch
                  checked={item.isAvailable}
                  label={`${pick(lang, item.nameEn, item.nameAr)} — ${t.common.toggleHint}`}
                  onLabel={t.common.available}
                  offLabel={t.common.outOfStock}
                  action={setSimpleAvailable.bind(null, kind, item.id)}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {full ? (
        <section className="mt-10 border border-dashed border-gold bg-white p-4">
          <h2 className="font-display mb-4 text-lg text-green">{t.simple.addItem}</h2>
          <ItemForm kind={kind} t={t} item={null} full />
        </section>
      ) : null}
    </>
  );
}
