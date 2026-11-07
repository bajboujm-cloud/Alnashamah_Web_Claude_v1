"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import type { FormState } from "@/components/admin/form-state";
import { audit } from "@/server/audit";
import { aedToFils, flag, isUuid, optInt, text } from "@/server/admin-forms";
import { authorize, NotAllowedError } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";
import { PICKUP_KEYS } from "@/server/settings";

/** Delivery set-up (placeholder until the owner decides fees, slots and cut-offs). Owner/manager only. */
async function guarded(fn: () => Promise<FormState>): Promise<FormState> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof NotAllowedError) return { status: "error", msg: "notAllowed", at: Date.now() };
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error(e);
    return { status: "error", msg: "error", at: Date.now() };
  }
}
const ok = (msg: FormState["msg"] = "saved"): FormState => ({ status: "ok", msg, at: Date.now() });
const fail = (fields: string[]): FormState => ({ status: "error", msg: "invalid", fields, at: Date.now() });
const isTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

export async function saveZone(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const id = text(data, "id");
    const fee = aedToFils(data, "feeAed");
    if (!isUuid(id)) return { status: "error", msg: "error", at: Date.now() };
    if (fee === "invalid") return fail(["feeAed"]);
    const before = await db.query.deliveryZones.findFirst({ where: eq(s.deliveryZones.id, id) });
    if (!before) return { status: "error", msg: "error", at: Date.now() };
    const update = { feeFils: fee, isActive: flag(data, "isActive") };
    await db.update(s.deliveryZones).set(update).where(eq(s.deliveryZones.id, id));
    await audit(
      user,
      "update",
      "delivery_zone",
      id,
      { feeFils: before.feeFils, isActive: before.isActive },
      update,
    );
    refresh();
    return ok();
  });
}

function slotValues(data: FormData) {
  const v = {
    nameEn: text(data, "nameEn", 80),
    nameAr: text(data, "nameAr", 80),
    startTime: text(data, "startTime", 5),
    endTime: text(data, "endTime", 5),
    capacity: optInt(data, "capacity", 1, 10_000),
    cutoffHours: optInt(data, "cutoffHours", 0, 720),
    isActive: flag(data, "isActive"),
  };
  const bad = [
    ...(!v.nameEn ? ["nameEn"] : []),
    ...(!v.nameAr ? ["nameAr"] : []),
    ...(!isTime(v.startTime) ? ["startTime"] : []),
    ...(!isTime(v.endTime) || v.endTime <= v.startTime ? ["endTime"] : []),
    ...(v.capacity === "invalid" ? ["capacity"] : []),
    ...(v.cutoffHours === "invalid" ? ["cutoffHours"] : []),
  ];
  return {
    bad,
    values: {
      ...v,
      capacity: v.capacity === "invalid" ? null : v.capacity,
      cutoffHours: typeof v.cutoffHours === "number" ? v.cutoffHours : 0,
    },
  };
}

export async function saveSlot(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const id = text(data, "id");
    const { bad, values } = slotValues(data);
    if (bad.length) return fail(bad);
    if (!id) {
      const count = (await db.select({ id: s.deliverySlots.id }).from(s.deliverySlots)).length;
      const [row] = await db
        .insert(s.deliverySlots)
        .values({ ...values, sortOrder: count + 1 })
        .returning();
      await audit(user, "create", "delivery_slot", row.id, null, row);
    } else {
      if (!isUuid(id)) return { status: "error", msg: "error", at: Date.now() };
      const before = await db.query.deliverySlots.findFirst({ where: eq(s.deliverySlots.id, id) });
      if (!before) return { status: "error", msg: "error", at: Date.now() };
      await db.update(s.deliverySlots).set(values).where(eq(s.deliverySlots.id, id));
      await audit(user, "update", "delivery_slot", id, before, values);
    }
    refresh();
    return ok();
  });
}

export async function deleteSlot(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const id = text(data, "id");
    if (!isUuid(id)) return { status: "error", msg: "error", at: Date.now() };
    const before = await db.query.deliverySlots.findFirst({ where: eq(s.deliverySlots.id, id) });
    await db.delete(s.deliverySlots).where(eq(s.deliverySlots.id, id));
    await audit(user, "delete", "delivery_slot", id, before ?? null, null);
    refresh();
    return ok("deleted");
  });
}

export async function addBlackout(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const date = text(data, "date", 10);
    if (!isDate(date)) return fail(["date"]);
    const row = { date, noteEn: text(data, "noteEn", 120), noteAr: text(data, "noteAr", 120) };
    await db
      .insert(s.deliveryBlackouts)
      .values(row)
      .onConflictDoUpdate({
        target: s.deliveryBlackouts.date,
        set: { noteEn: row.noteEn, noteAr: row.noteAr },
      });
    await audit(user, "create", "delivery_blackout", null, null, row);
    refresh();
    return ok();
  });
}

export async function removeBlackout(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const date = text(data, "date", 10);
    if (!isDate(date)) return { status: "error", msg: "error", at: Date.now() };
    await db.delete(s.deliveryBlackouts).where(eq(s.deliveryBlackouts.date, date));
    await audit(user, "delete", "delivery_blackout", null, { date }, null);
    refresh();
    return ok("deleted");
  });
}

export async function savePickup(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const values: Record<(typeof PICKUP_KEYS)[number], unknown> = {
      "delivery.pickup_enabled": flag(data, "enabled"),
      "delivery.pickup_address_en": text(data, "addressEn", 300),
      "delivery.pickup_address_ar": text(data, "addressAr", 300),
    };
    for (const key of PICKUP_KEYS)
      await db
        .insert(s.settings)
        .values({ key, value: values[key] })
        .onConflictDoUpdate({ target: s.settings.key, set: { value: values[key], updatedAt: new Date() } });
    await audit(user, "update", "settings", "delivery.pickup", null, values);
    refresh();
    return ok();
  });
}
