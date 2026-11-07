import { asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Checkbox, SubmitButton, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { dubaiToday } from "@/lib/delivery";
import { formatDay } from "@/lib/dates";
import { requireStaff } from "@/server/auth/staff";
import { getDeliverySetup } from "@/server/checkout";
import { db, schema as s } from "@/server/db";
import {
  addBlackout,
  deleteSlot,
  removeBlackout,
  saveSlot,
  savePickup,
  saveZone,
} from "../../_actions/delivery";

type Slot = typeof s.deliverySlots.$inferSelect;

/** Fees per emirate, time slots, days without delivery and pick-up (placeholders until decided). */
export default async function DeliveryPage({ params }: PageProps<"/[lang]/admin/delivery">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireStaff(lang, "settings.edit");
  const t = (await getDictionary(lang)).admin;
  const d = t.delivery;
  const [zones, slots, setup] = await Promise.all([
    db.select().from(s.deliveryZones).orderBy(asc(s.deliveryZones.sortOrder)),
    db.select().from(s.deliverySlots).orderBy(asc(s.deliverySlots.sortOrder)),
    getDeliverySetup(),
  ]);
  const box = "border border-line bg-white p-4 sm:p-6";
  const h2 = "font-display mb-1 text-xl text-green";

  const slotFields = (x: Slot | null) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TextInput label={t.common.nameEn} name="nameEn" defaultValue={x?.nameEn} required dir="ltr" />
      <TextInput label={t.common.nameAr} name="nameAr" defaultValue={x?.nameAr} required dir="rtl" />
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label={d.startTime}
          name="startTime"
          type="time"
          defaultValue={x?.startTime ?? "09:00"}
          required
        />
        <TextInput
          label={d.endTime}
          name="endTime"
          type="time"
          defaultValue={x?.endTime ?? "21:00"}
          required
        />
      </div>
      <TextInput
        label={d.capacity}
        name="capacity"
        type="number"
        min={1}
        inputMode="numeric"
        defaultValue={x?.capacity ?? ""}
        dir="ltr"
      />
      <TextInput
        label={d.cutoff}
        name="cutoffHours"
        type="number"
        min={0}
        inputMode="numeric"
        defaultValue={x?.cutoffHours ?? 0}
        dir="ltr"
      />
      <div className="pt-6">
        <Checkbox label={d.delivered} name="isActive" defaultChecked={x?.isActive ?? true} />
      </div>
    </div>
  );

  return (
    <>
      <PageTitle title={d.title} />
      <div className="space-y-6">
        <section className={box} data-testid="admin-zones">
          <h2 className={h2}>{d.zones}</h2>
          <p className="mb-4 text-sm text-muted">{d.zonesHelp}</p>
          <div className="space-y-2">
            {zones.map((z) => (
              <ActionForm key={z.id} action={saveZone} messages={t.msg} className="border-t border-line pt-3">
                <input type="hidden" name="id" value={z.id} />
                <div className="flex flex-wrap items-end gap-3" data-testid="admin-zone" data-slug={z.slug}>
                  <p className="min-w-32 flex-1 pb-3 font-semibold text-green">
                    {pick(lang, z.nameEn, z.nameAr)}
                  </p>
                  <div className="w-36">
                    <TextInput
                      label={d.fee}
                      name="feeAed"
                      inputMode="decimal"
                      placeholder={d.feeTbc}
                      defaultValue={z.feeFils != null ? String(z.feeFils / 100) : ""}
                      dir="ltr"
                    />
                  </div>
                  <div className="pb-3">
                    <Checkbox label={d.delivered} name="isActive" defaultChecked={z.isActive} />
                  </div>
                  <SubmitButton variant="quiet">{t.common.save}</SubmitButton>
                </div>
              </ActionForm>
            ))}
          </div>
        </section>

        <section className={box} data-testid="admin-slots">
          <h2 className={h2}>{d.slots}</h2>
          <p className="mb-4 text-sm text-muted">{d.slotsHelp}</p>
          <div className="space-y-4">
            {slots.map((x) => (
              <div key={x.id} className="space-y-2 border-t border-line pt-4" data-testid="admin-slot">
                <ActionForm action={saveSlot} messages={t.msg} className="space-y-3">
                  <input type="hidden" name="id" value={x.id} />
                  {slotFields(x)}
                  <SubmitButton>{t.common.save}</SubmitButton>
                </ActionForm>
                <ActionForm action={deleteSlot} messages={t.msg}>
                  <input type="hidden" name="id" value={x.id} />
                  <ConfirmButton question={t.common.confirmDelete}>{t.common.delete}</ConfirmButton>
                </ActionForm>
              </div>
            ))}
            <details className="border-t border-line pt-4">
              <summary className="min-h-11 cursor-pointer font-semibold text-green">+ {d.addSlot}</summary>
              <ActionForm action={saveSlot} messages={t.msg} resetOnSuccess className="mt-3 space-y-3">
                <input type="hidden" name="id" value="" />
                {slotFields(null)}
                <SubmitButton>{t.common.add}</SubmitButton>
              </ActionForm>
            </details>
          </div>
        </section>

        <section className={box} data-testid="admin-blackouts">
          <h2 className={h2}>{d.blackouts}</h2>
          <p className="mb-4 text-sm text-muted">{d.blackoutsHelp}</p>
          {setup.blackouts.length ? (
            <ul className="mb-4 space-y-2">
              {setup.blackouts.map((b) => (
                <li
                  key={b.date}
                  className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-semibold">{formatDay(b.date, lang)}</span>
                    {pick(lang, b.noteEn, b.noteAr) ? ` — ${pick(lang, b.noteEn, b.noteAr)}` : ""}
                  </span>
                  <ActionForm action={removeBlackout} messages={t.msg}>
                    <input type="hidden" name="date" value={b.date} />
                    <SubmitButton variant="danger">{t.common.delete}</SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          ) : null}
          <ActionForm action={addBlackout} messages={t.msg} resetOnSuccess className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput label={d.date} name="date" type="date" min={dubaiToday(new Date())} required />
              <TextInput label={d.noteEn} name="noteEn" dir="ltr" />
              <TextInput label={d.noteAr} name="noteAr" dir="rtl" />
            </div>
            <SubmitButton variant="quiet">{d.addBlackout}</SubmitButton>
          </ActionForm>
        </section>

        <section className={box} data-testid="admin-pickup">
          <h2 className={`${h2} mb-4`}>{d.pickup}</h2>
          <ActionForm action={savePickup} messages={t.msg} className="space-y-3">
            <Checkbox label={d.pickupEnabled} name="enabled" defaultChecked={setup.pickup.enabled} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label={d.pickupAddressEn}
                name="addressEn"
                defaultValue={setup.pickup.addressEn}
                dir="ltr"
              />
              <TextInput
                label={d.pickupAddressAr}
                name="addressAr"
                defaultValue={setup.pickup.addressAr}
                dir="rtl"
              />
            </div>
            <SubmitButton>{t.common.save}</SubmitButton>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
