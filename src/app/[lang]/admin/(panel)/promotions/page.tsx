import { asc } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton, TextInput } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/ImageField";
import { PageTitle } from "@/components/admin/PageTitle";
import { Switch } from "@/components/admin/Switch";
import { hasLocale, pick } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/dictionaries";
import { isSeasonVisible } from "@/lib/availability";
import { requireStaff } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";
import { deletePromotion, movePromotion, savePromotion, setPromotionActive } from "../../_actions/promotions";

type Promo = typeof s.promotions.$inferSelect;
const day = (d: Date | null) => (d ? new Date(d.getTime() + 4 * 3_600_000).toISOString().slice(0, 10) : "");

function PromoForm({ t, p }: { t: Dictionary["admin"]; p: Promo | null }) {
  const m = t.promotions;
  return (
    <ActionForm action={savePromotion} messages={t.msg} resetOnSuccess={!p} className="space-y-4">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <ImageField
        label={m.image}
        hint={m.imageHelp}
        name="image"
        current={p?.imageUrl ?? null}
        removeLabel=""
      />
      <ImageField
        label={m.imageMobile}
        hint={m.imageMobileHelp}
        name="imageMobile"
        current={p?.imageMobileUrl ?? null}
        removeLabel={t.common.removeImage}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={m.titleEn} name="titleEn" defaultValue={p?.titleEn} dir="ltr" />
        <TextInput label={m.titleAr} name="titleAr" defaultValue={p?.titleAr} dir="rtl" />
        <TextInput label={m.textEn} name="textEn" defaultValue={p?.textEn} dir="ltr" />
        <TextInput label={m.textAr} name="textAr" defaultValue={p?.textAr} dir="rtl" />
        <TextInput label={m.buttonEn} name="buttonEn" defaultValue={p?.buttonEn} dir="ltr" />
        <TextInput label={m.buttonAr} name="buttonAr" defaultValue={p?.buttonAr} dir="rtl" />
        <TextInput
          label={m.link}
          hint={m.linkHelp}
          name="linkUrl"
          defaultValue={p?.linkUrl ?? ""}
          dir="ltr"
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label={m.startsAt} name="startsAt" type="date" defaultValue={day(p?.startsAt ?? null)} />
          <TextInput label={m.endsAt} name="endsAt" type="date" defaultValue={day(p?.endsAt ?? null)} />
        </div>
      </div>
      <SubmitButton>{p ? t.common.save : t.common.add}</SubmitButton>
    </ActionForm>
  );
}

export default async function PromotionsPage({ params }: PageProps<"/[lang]/admin/promotions">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireStaff(lang, "catalog.content");
  const t = (await getDictionary(lang)).admin;
  const promos = await db
    .select()
    .from(s.promotions)
    .orderBy(asc(s.promotions.sortOrder), asc(s.promotions.createdAt));

  return (
    <>
      <PageTitle title={t.promotions.title} help={t.promotions.help} />
      <div className="space-y-3">
        {promos.length === 0 ? <p className="text-sm text-muted">{t.common.none}</p> : null}
        {promos.map((p, i) => (
          <div
            key={p.id}
            className={`border bg-white ${isSeasonVisible(p) ? "border-line" : "border-dashed border-muted"}`}
            data-testid="admin-promotion"
          >
            <div className="flex items-center gap-3 p-3">
              <div className="relative aspect-[3/1] w-28 shrink-0 overflow-hidden bg-ivory-200">
                <Image src={p.imageUrl} alt="" fill sizes="112px" className="object-cover" />
              </div>
              <p className="min-w-0 flex-1 truncate font-semibold text-green">
                {pick(lang, p.titleEn, p.titleAr) || `#${i + 1}`}
              </p>
              <Switch
                checked={p.isActive}
                label={`${pick(lang, p.titleEn, p.titleAr) || `#${i + 1}`} — ${t.common.visibilityHint}`}
                onLabel={t.common.shown}
                offLabel={t.common.hiddenLabel}
                action={setPromotionActive.bind(null, p.id)}
                testId="promotion-switch"
              />
            </div>
            <details className="border-t border-line">
              <summary className="cursor-pointer px-3 py-2 text-sm text-gold-deep">{t.common.edit}</summary>
              <div className="space-y-4 p-3">
                <PromoForm t={t} p={p} />
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  {i > 0 ? (
                    <form action={movePromotion}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="dir" value="up" />
                      <SubmitButton variant="quiet">↑ {t.common.moveUp}</SubmitButton>
                    </form>
                  ) : null}
                  {i < promos.length - 1 ? (
                    <form action={movePromotion}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="dir" value="down" />
                      <SubmitButton variant="quiet">↓ {t.common.moveDown}</SubmitButton>
                    </form>
                  ) : null}
                  <form action={deletePromotion} className="ms-auto">
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton question={t.common.confirmDelete}>{t.common.delete}</ConfirmButton>
                  </form>
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>
      <section className="mt-10 border border-dashed border-gold bg-white p-4">
        <h2 className="font-display mb-4 text-lg text-green">{t.promotions.newTitle}</h2>
        <PromoForm t={t} p={null} />
      </section>
    </>
  );
}
