"use server";

import { asc, count, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import type { FormState } from "@/components/admin/form-state";
import { audit } from "@/server/audit";
import { aedToFils, flag, isSlug, isUuid, RESERVED_SLUGS, text, upload } from "@/server/admin-forms";
import { can } from "@/server/auth/permissions";
import { authorize, NotAllowedError } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";
import { SETTING_KEYS } from "@/server/settings";
import { deleteStoredFile } from "@/server/storage";

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
const fail = (msg: FormState["msg"], fields?: string[]): FormState => ({
  status: "error",
  msg,
  fields,
  at: Date.now(),
});

const names = (data: FormData) => ({
  nameEn: text(data, "nameEn", 80),
  nameAr: text(data, "nameAr", 80),
  descriptionEn: text(data, "descriptionEn"),
  descriptionAr: text(data, "descriptionAr"),
});

/* --------------------------------- categories --------------------------------- */

export async function saveCategory(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.content");
    const full = can(user.role, "catalog.prices");
    const id = text(data, "id");
    const v = names(data);
    const slug = text(data, "slug", 60);
    const status = text(data, "status") as "active" | "coming_soon" | "hidden";
    const bad = [...(!v.nameEn ? ["nameEn"] : []), ...(!v.nameAr ? ["nameAr"] : [])];
    if (full && !isSlug(slug)) bad.push("slug");
    if (bad.length) return fail("invalid", bad);
    if (full && RESERVED_SLUGS.has(slug)) return fail("slugReserved", ["slug"]);
    if (full && !["active", "coming_soon", "hidden"].includes(status)) return fail("invalid", ["status"]);

    const image = await upload(data, "illustration", "categories", true);
    if (image && !image.ok) return fail(image.error, ["illustration"]);

    if (full) {
      const clash = await db.query.categories.findFirst({ where: eq(s.categories.slug, slug) });
      if (clash && clash.id !== id) return fail("slugTaken", ["slug"]);
    }

    if (!id) {
      if (!full) throw new NotAllowedError();
      const [{ next }] = await db.select({ next: max(s.categories.sortOrder) }).from(s.categories);
      const [created] = await db
        .insert(s.categories)
        .values({
          ...v,
          slug,
          status,
          sortOrder: (next ?? 0) + 1,
          illustrationUrl: image?.ok ? image.url : null,
        })
        .returning();
      await audit(user, "create", "category", created.id, null, created);
      refresh();
      return ok();
    }
    if (!isUuid(id)) return fail("error");
    const before = await db.query.categories.findFirst({ where: eq(s.categories.id, id) });
    if (!before) return fail("error");
    const illustrationUrl = image?.ok
      ? image.url
      : flag(data, "removeIllustration")
        ? null
        : before.illustrationUrl;
    const update = { ...v, illustrationUrl, ...(full ? { slug, status } : {}) };
    await db.update(s.categories).set(update).where(eq(s.categories.id, id));
    if (illustrationUrl !== before.illustrationUrl) await deleteStoredFile(before.illustrationUrl);
    await audit(user, "update", "category", id, before, update);
    refresh();
    return ok();
  });
}

/** One-tap show / hide. Showing again makes it Active if it has breeds, otherwise "Coming soon". */
export async function setCategoryVisible(id: string, visible: boolean) {
  const user = await authorize("catalog.prices");
  if (!isUuid(id)) return;
  let status: "active" | "coming_soon" | "hidden" = "hidden";
  if (visible) {
    const [{ n }] = await db.select({ n: count() }).from(s.breeds).where(eq(s.breeds.categoryId, id));
    status = n > 0 ? "active" : "coming_soon";
  }
  await db.update(s.categories).set({ status }).where(eq(s.categories.id, id));
  await audit(user, visible ? "show" : "hide", "category", id, null, { status });
  refresh();
}

export async function deleteCategory(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.prices");
    const id = text(data, "id");
    if (!isUuid(id)) return fail("error");
    const [{ n }] = await db.select({ n: count() }).from(s.breeds).where(eq(s.breeds.categoryId, id));
    if (n > 0) return fail("inUse");
    const [gone] = await db.delete(s.categories).where(eq(s.categories.id, id)).returning();
    if (gone) {
      await deleteStoredFile(gone.illustrationUrl);
      await audit(user, "delete", "category", id, gone, null);
    }
    refresh();
    return ok("deleted");
  });
}

/* ------------------------------ seasonal offers ------------------------------ */

const dateOrNull = (v: string) => {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00+04:00`); // UAE time
  return Number.isNaN(d.getTime()) ? ("invalid" as const) : d;
};

export async function saveSeasonal(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.content");
    const full = can(user.role, "catalog.prices");
    const id = text(data, "id");
    const v = names(data);
    const slug = text(data, "slug", 60);
    const startsAt = dateOrNull(text(data, "startsAt"));
    const endsAt = dateOrNull(text(data, "endsAt"));
    const bad = [...(!v.nameEn ? ["nameEn"] : []), ...(!v.nameAr ? ["nameAr"] : [])];
    if (full && !isSlug(slug)) bad.push("slug");
    if (startsAt === "invalid") bad.push("startsAt");
    if (endsAt === "invalid") bad.push("endsAt");
    if (bad.length) return fail("invalid", bad);
    const breedIds = data.getAll("breedIds").map(String).filter(isUuid);

    const image = await upload(data, "illustration", "seasonal", true);
    if (image && !image.ok) return fail(image.error, ["illustration"]);
    if (full) {
      const clash = await db.query.seasonalCollections.findFirst({
        where: eq(s.seasonalCollections.slug, slug),
      });
      if (clash && clash.id !== id) return fail("slugTaken", ["slug"]);
    }
    const structure = full
      ? {
          slug,
          isActive: flag(data, "isActive"),
          startsAt: startsAt as Date | null,
          endsAt: endsAt as Date | null,
        }
      : {};

    let collectionId = id;
    if (!id) {
      if (!full) throw new NotAllowedError();
      const [created] = await db
        .insert(s.seasonalCollections)
        .values({ ...v, slug, ...structure, illustrationUrl: image?.ok ? image.url : null })
        .returning();
      collectionId = created.id;
      await audit(user, "create", "seasonal", created.id, null, created);
    } else {
      if (!isUuid(id)) return fail("error");
      const before = await db.query.seasonalCollections.findFirst({
        where: eq(s.seasonalCollections.id, id),
      });
      if (!before) return fail("error");
      const illustrationUrl = image?.ok
        ? image.url
        : flag(data, "removeIllustration")
          ? null
          : before.illustrationUrl;
      const update = { ...v, illustrationUrl, ...structure };
      await db.update(s.seasonalCollections).set(update).where(eq(s.seasonalCollections.id, id));
      if (illustrationUrl !== before.illustrationUrl) await deleteStoredFile(before.illustrationUrl);
      await audit(user, "update", "seasonal", id, before, update);
    }
    if (full) {
      await db.transaction(async (tx) => {
        await tx
          .delete(s.seasonalCollectionBreeds)
          .where(eq(s.seasonalCollectionBreeds.collectionId, collectionId));
        if (breedIds.length)
          await tx
            .insert(s.seasonalCollectionBreeds)
            .values(breedIds.map((breedId) => ({ collectionId, breedId })));
      });
    }
    refresh();
    return ok();
  });
}

export async function setSeasonalVisible(id: string, visible: boolean) {
  const user = await authorize("catalog.prices");
  if (!isUuid(id)) return;
  await db.update(s.seasonalCollections).set({ isActive: visible }).where(eq(s.seasonalCollections.id, id));
  await audit(user, visible ? "show" : "hide", "seasonal", id);
  refresh();
}

export async function deleteSeasonal(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.prices");
    const id = text(data, "id");
    if (!isUuid(id)) return fail("error");
    const [gone] = await db.delete(s.seasonalCollections).where(eq(s.seasonalCollections.id, id)).returning();
    if (gone) {
      await deleteStoredFile(gone.illustrationUrl);
      await audit(user, "delete", "seasonal", id, gone, null);
    }
    refresh();
    return ok("deleted");
  });
}

/* --------------------- cutting options, order extras, packaging --------------------- */

const simpleTables = {
  cutting: s.cuttingOptions,
  extras: s.extras,
  packaging: s.packagingOptions,
} as const;
export type SimpleKind = keyof typeof simpleTables;
const isKind = (k: string): k is SimpleKind => k in simpleTables;

export async function setSimpleAvailable(kind: SimpleKind, id: string, available: boolean) {
  const user = await authorize("stock.toggle");
  if (!isKind(kind) || !isUuid(id)) return;
  const table = simpleTables[kind];
  await db.update(table).set({ isAvailable: available }).where(eq(table.id, id));
  await audit(user, available ? "in-stock" : "out-of-stock", kind, id);
  refresh();
}

export async function saveSimple(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.content");
    const full = can(user.role, "catalog.prices");
    const kind = text(data, "kind");
    if (!isKind(kind)) return fail("error");
    const id = text(data, "id");
    const nameEn = text(data, "nameEn", 80);
    const nameAr = text(data, "nameAr", 80);
    const priceFils = aedToFils(data, "priceAed");
    const bad = [...(!nameEn ? ["nameEn"] : []), ...(!nameAr ? ["nameAr"] : [])];
    if (full && (priceFils === "invalid" || priceFils === null)) bad.push("priceAed");
    if (bad.length) return fail("invalid", bad);

    const content: Record<string, unknown> = { nameEn, nameAr };
    if (kind !== "extras") {
      content.descriptionEn = text(data, "descriptionEn");
      content.descriptionAr = text(data, "descriptionAr");
    }
    if (kind === "cutting") {
      const video = text(data, "videoUrl", 500);
      if (video && !/^https:\/\/\S+$/.test(video)) return fail("invalid", ["videoUrl"]);
      content.videoUrl = video || null;
    }
    const structure: Record<string, unknown> = full ? { priceFils } : {};
    if (full && kind === "extras") structure.selectedByDefault = flag(data, "selectedByDefault");

    const image = kind === "extras" ? undefined : await upload(data, "photo", kind);
    if (image && !image.ok) return fail(image.error, ["photo"]);

    const table = simpleTables[kind];
    if (!id) {
      if (!full) throw new NotAllowedError();
      const slug = `${
        nameEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || kind
      }-${Date.now().toString(36)}`;
      const [{ next }] = await db.select({ next: max(table.sortOrder) }).from(table);
      const values = {
        ...content,
        ...structure,
        slug,
        nameEn,
        nameAr,
        sortOrder: (next ?? 0) + 1,
        ...(image?.ok ? { photoUrl: image.url } : {}),
      };
      // The three tables share these columns; Drizzle can't infer that across a union.
      const [created] = await db
        .insert(table)
        .values(values as never)
        .returning({ id: table.id });
      if (kind === "cutting") {
        const cats = await db
          .select({ id: s.categories.id })
          .from(s.categories)
          .orderBy(asc(s.categories.sortOrder));
        if (cats.length)
          await db
            .insert(s.cuttingOptionCategories)
            .values(cats.map((c) => ({ cuttingOptionId: created.id, categoryId: c.id })));
      }
      await audit(user, "create", kind, created.id, null, values);
      refresh();
      return ok();
    }
    if (!isUuid(id)) return fail("error");
    const [before] = await db.select().from(table).where(eq(table.id, id));
    if (!before) return fail("error");
    const update: Record<string, unknown> = { ...content, ...structure };
    if (kind !== "extras" && "photoUrl" in before) {
      const photoUrl = image?.ok ? image.url : flag(data, "removePhoto") ? null : before.photoUrl;
      update.photoUrl = photoUrl;
      if (photoUrl !== before.photoUrl) await deleteStoredFile(before.photoUrl);
    }
    await db
      .update(table)
      .set(update as never)
      .where(eq(table.id, id));
    await audit(user, "update", kind, id, before, update);
    refresh();
    return ok();
  });
}

export async function deleteSimple(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("catalog.prices");
    const kind = text(data, "kind");
    const id = text(data, "id");
    if (!isKind(kind) || !isUuid(id)) return fail("error");
    const table = simpleTables[kind];
    const [gone] = await db.delete(table).where(eq(table.id, id)).returning();
    if (gone) {
      if ("photoUrl" in gone) await deleteStoredFile(gone.photoUrl);
      await audit(user, "delete", kind, id, gone, null);
    }
    refresh();
    return ok("deleted");
  });
}

/* ---------------------------------- settings ---------------------------------- */

export async function saveSettings(_prev: FormState, data: FormData): Promise<FormState> {
  return guarded(async () => {
    const user = await authorize("settings.edit");
    const values: Record<string, unknown> = {};
    for (const key of SETTING_KEYS) {
      if (key === "tax.prices_include_vat") values[key] = flag(data, key);
      else if (key === "tax.vat_rate_percent") {
        const n = Number(text(data, key) || "5");
        if (!Number.isFinite(n) || n < 0 || n > 100) return fail("invalid", [key]);
        values[key] = n;
      } else values[key] = text(data, key, 300);
    }
    if (values["company.whatsapp"] && !/^\d{8,15}$/.test(String(values["company.whatsapp"])))
      return fail("invalid", ["company.whatsapp"]);
    if (values["company.email"] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values["company.email"])))
      return fail("invalid", ["company.email"]);
    const before = await db.select().from(s.settings);
    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(values))
        await tx
          .insert(s.settings)
          .values({ key, value })
          .onConflictDoUpdate({ target: s.settings.key, set: { value } });
    });
    await audit(
      user,
      "update",
      "settings",
      null,
      Object.fromEntries(before.map((r) => [r.key, r.value])),
      values,
    );
    refresh();
    return ok();
  });
}
