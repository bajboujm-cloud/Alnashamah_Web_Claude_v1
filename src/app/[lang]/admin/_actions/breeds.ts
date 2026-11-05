"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/admin/form-state";
import { hasLocale } from "@/i18n/config";
import { audit } from "@/server/audit";
import {
  aedToFils,
  invalidFields,
  isSlug,
  isUuid,
  optDecimal,
  optInt,
  text,
  upload,
} from "@/server/admin-forms";
import { can } from "@/server/auth/permissions";
import { authorize, NotAllowedError } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";
import { deleteStoredFile } from "@/server/storage";

const sizeLabels = [
  ["Small", "صغير"],
  ["Medium", "وسط"],
  ["Large", "كبير"],
  ["Extra large", "كبير جداً"],
  ["Jumbo", "جامبو"],
] as const;

/** Runs an action and turns "not allowed" / unexpected errors into a friendly message. */
async function guarded(fn: () => Promise<FormState>): Promise<FormState> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof NotAllowedError) return { status: "error", msg: "notAllowed", at: Date.now() };
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect() / notFound()
    console.error(e);
    return { status: "error", msg: "error", at: Date.now() };
  }
}

const ok = (): FormState => ({ status: "ok", msg: "saved", at: Date.now() });

/* ------------------------------- one-tap switches ------------------------------- */

export async function setBreedAvailable(id: string, available: boolean) {
  const user = await authorize("stock.toggle");
  if (!isUuid(id)) return;
  await db.update(s.breeds).set({ isAvailable: available }).where(eq(s.breeds.id, id));
  await audit(user, available ? "in-stock" : "out-of-stock", "breed", id);
  refresh();
}

export async function setOptionAvailable(id: string, available: boolean) {
  const user = await authorize("stock.toggle");
  if (!isUuid(id)) return;
  await db.update(s.breedOptions).set({ isAvailable: available }).where(eq(s.breedOptions.id, id));
  await audit(user, available ? "in-stock" : "out-of-stock", "size", id);
  refresh();
}

/* ----------------------------------- breed ----------------------------------- */

export async function saveBreed(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.content");
    const full = can(user.role, "catalog.prices");
    const id = text(data, "id");
    const lang = text(data, "lang");
    const values = {
      nameEn: text(data, "nameEn", 80),
      nameAr: text(data, "nameAr", 80),
      descriptionEn: text(data, "descriptionEn"),
      descriptionAr: text(data, "descriptionAr"),
    };
    const slug = text(data, "slug", 60);
    const categoryId = text(data, "categoryId");
    const bad = [
      ...(!values.nameEn ? ["nameEn"] : []),
      ...(!values.nameAr ? ["nameAr"] : []),
      ...(full && !isSlug(slug) ? ["slug"] : []),
      ...(full && !isUuid(categoryId) ? ["categoryId"] : []),
    ];
    if (bad.length) return { status: "error", msg: "invalid", fields: bad, at: Date.now() };

    const photo = await upload(data, "photo", "breeds");
    if (photo && !photo.ok) return { status: "error", msg: photo.error, fields: ["photo"], at: Date.now() };

    if (!id) {
      if (!full) throw new NotAllowedError();
      const clash = await db.query.breeds.findFirst({
        where: and(eq(s.breeds.categoryId, categoryId), eq(s.breeds.slug, slug)),
      });
      if (clash) return { status: "error", msg: "slugTaken", fields: ["slug"], at: Date.now() };
      const [{ next }] = await db
        .select({ next: max(s.breeds.sortOrder) })
        .from(s.breeds)
        .where(eq(s.breeds.categoryId, categoryId));
      const [created] = await db
        .insert(s.breeds)
        .values({
          ...values,
          slug,
          categoryId,
          sortOrder: (next ?? 0) + 1,
          photoUrl: photo?.ok ? photo.url : null,
        })
        .returning();
      await db.insert(s.breedOptions).values(
        sizeLabels.slice(0, 3).map(([en, ar], i) => ({
          breedId: created.id,
          labelEn: en,
          labelAr: ar,
          sortOrder: i + 1,
        })),
      );
      await audit(user, "create", "breed", created.id, null, { ...values, slug });
      redirect(`/${hasLocale(lang) ? lang : "ar"}/admin/breeds/${created.id}?created=1`);
    }

    if (!isUuid(id)) return { status: "error", msg: "error", at: Date.now() };
    const before = await db.query.breeds.findFirst({ where: eq(s.breeds.id, id) });
    if (!before) return { status: "error", msg: "error", at: Date.now() };
    if (full && (slug !== before.slug || categoryId !== before.categoryId)) {
      const clash = await db.query.breeds.findFirst({
        where: and(eq(s.breeds.categoryId, categoryId), eq(s.breeds.slug, slug)),
      });
      if (clash && clash.id !== id)
        return { status: "error", msg: "slugTaken", fields: ["slug"], at: Date.now() };
    }
    const removePhoto = data.get("removePhoto") === "on";
    const photoUrl = photo?.ok ? photo.url : removePhoto ? null : before.photoUrl;
    const update = { ...values, photoUrl, ...(full ? { slug, categoryId } : {}) };
    await db.update(s.breeds).set(update).where(eq(s.breeds.id, id));
    if (photoUrl !== before.photoUrl) await deleteStoredFile(before.photoUrl);
    await audit(user, "update", "breed", id, before, update);
    refresh();
    return ok();
  });
}

export async function deleteBreed(data: FormData) {
  const user = await authorize("catalog.prices");
  const id = text(data, "id");
  const lang = text(data, "lang");
  if (!isUuid(id)) return;
  const [gone] = await db.delete(s.breeds).where(eq(s.breeds.id, id)).returning();
  if (gone) {
    await deleteStoredFile(gone.photoUrl);
    await audit(user, "delete", "breed", id, gone, null);
  }
  redirect(`/${hasLocale(lang) ? lang : "ar"}/admin/breeds`);
}

/* ---------------------------------- sizes ---------------------------------- */

export async function saveOption(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.prices");
    const id = text(data, "id");
    if (!isUuid(id)) return { status: "error", msg: "error", at: Date.now() };
    const v = {
      labelEn: text(data, "labelEn", 40) || null,
      labelAr: text(data, "labelAr", 40) || null,
      ageMinMonths: optInt(data, "ageMinMonths", 0, 600),
      ageMaxMonths: optInt(data, "ageMaxMonths", 0, 600),
      weightMinKg: optDecimal(data, "weightMinKg", 2000),
      weightMaxKg: optDecimal(data, "weightMaxKg", 2000),
      priceFils: aedToFils(data, "priceAed"),
      compareAtPriceFils: aedToFils(data, "compareAtAed"),
    };
    const bad = invalidFields(v).map((k) =>
      k === "priceFils" ? "priceAed" : k === "compareAtPriceFils" ? "compareAtAed" : k,
    );
    const num = (x: unknown) => (typeof x === "number" ? x : null);
    if (
      num(v.ageMinMonths) !== null &&
      num(v.ageMaxMonths) !== null &&
      num(v.ageMinMonths)! > num(v.ageMaxMonths)!
    )
      bad.push("ageMinMonths", "ageMaxMonths");
    if (
      num(v.weightMinKg) !== null &&
      num(v.weightMaxKg) !== null &&
      num(v.weightMinKg)! > num(v.weightMaxKg)!
    )
      bad.push("weightMinKg", "weightMaxKg");
    if (bad.length) return { status: "error", msg: "invalid", fields: bad, at: Date.now() };

    const before = await db.query.breedOptions.findFirst({ where: eq(s.breedOptions.id, id) });
    if (!before) return { status: "error", msg: "error", at: Date.now() };
    const update = v as {
      [K in keyof typeof v]: Exclude<(typeof v)[K], "invalid">;
    };
    await db.update(s.breedOptions).set(update).where(eq(s.breedOptions.id, id));
    await audit(user, "update", "size", id, before, update);
    refresh();
    return ok();
  });
}

export async function addOption(data: FormData) {
  const user = await authorize("catalog.prices");
  const breedId = text(data, "breedId");
  if (!isUuid(breedId)) return;
  const existing = await db
    .select({ sortOrder: s.breedOptions.sortOrder })
    .from(s.breedOptions)
    .where(eq(s.breedOptions.breedId, breedId));
  const position = existing.length;
  const nextOrder = Math.max(0, ...existing.map((o) => o.sortOrder)) + 1;
  const [en, ar] = sizeLabels[position] ?? [`Size ${position + 1}`, `الحجم ${position + 1}`];
  const [created] = await db
    .insert(s.breedOptions)
    .values({ breedId, labelEn: en, labelAr: ar, sortOrder: nextOrder })
    .returning();
  await audit(user, "create", "size", created.id, null, { breedId });
  refresh();
}

export async function deleteOption(data: FormData) {
  const user = await authorize("catalog.prices");
  const id = text(data, "id");
  if (!isUuid(id)) return;
  const [gone] = await db.delete(s.breedOptions).where(eq(s.breedOptions.id, id)).returning();
  if (gone) await audit(user, "delete", "size", id, gone, null);
  refresh();
}

export async function moveOption(data: FormData) {
  const user = await authorize("catalog.prices");
  const id = text(data, "id");
  const dir = text(data, "dir") === "up" ? -1 : 1;
  if (!isUuid(id)) return;
  const me = await db.query.breedOptions.findFirst({ where: eq(s.breedOptions.id, id) });
  if (!me) return;
  const siblings = await db
    .select()
    .from(s.breedOptions)
    .where(eq(s.breedOptions.breedId, me.breedId))
    .orderBy(asc(s.breedOptions.sortOrder), asc(s.breedOptions.createdAt));
  const i = siblings.findIndex((o) => o.id === id);
  const j = i + dir;
  if (j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  await db.transaction(async (tx) => {
    for (const [index, o] of siblings.entries())
      await tx
        .update(s.breedOptions)
        .set({ sortOrder: index + 1 })
        .where(eq(s.breedOptions.id, o.id));
  });
  await audit(user, "reorder", "size", id);
  refresh();
}
