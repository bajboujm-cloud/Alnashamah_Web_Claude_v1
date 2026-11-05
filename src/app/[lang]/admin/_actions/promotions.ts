"use server";

import { asc, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import type { FormState } from "@/components/admin/form-state";
import { audit } from "@/server/audit";
import { flag, isUuid, text, upload } from "@/server/admin-forms";
import { authorize, NotAllowedError } from "@/server/auth/staff";
import { db, schema as s } from "@/server/db";
import { deleteStoredFile } from "@/server/storage";

const fail = (msg: FormState["msg"], fields?: string[]): FormState => ({
  status: "error",
  msg,
  fields,
  at: Date.now(),
});

const dateOrNull = (v: string) => {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00+04:00`); // UAE time
  return Number.isNaN(d.getTime()) ? ("invalid" as const) : d;
};

/** Only links to pages of this site ("/…") or full https:// addresses are allowed. */
const safeLink = (v: string) =>
  v === "" || /^\/(?!\/)\S*$/.test(v) || /^https:\/\/\S+$/.test(v) ? v : "invalid";

export async function savePromotion(_prev: FormState, data: FormData): Promise<FormState> {
  try {
    const user = await authorize("catalog.content");
    const id = text(data, "id");
    const linkUrl = safeLink(text(data, "linkUrl", 500));
    const startsAt = dateOrNull(text(data, "startsAt"));
    const endsAt = dateOrNull(text(data, "endsAt"));
    const bad = [
      ...(linkUrl === "invalid" ? ["linkUrl"] : []),
      ...(startsAt === "invalid" ? ["startsAt"] : []),
      ...(endsAt === "invalid" ? ["endsAt"] : []),
    ];
    if (bad.length) return fail("invalid", bad);
    const image = await upload(data, "image", "promotions");
    if (image && !image.ok) return fail(image.error, ["image"]);
    const mobile = await upload(data, "imageMobile", "promotions");
    if (mobile && !mobile.ok) return fail(mobile.error, ["imageMobile"]);

    const values = {
      titleEn: text(data, "titleEn", 120),
      titleAr: text(data, "titleAr", 120),
      textEn: text(data, "textEn", 300),
      textAr: text(data, "textAr", 300),
      buttonEn: text(data, "buttonEn", 40),
      buttonAr: text(data, "buttonAr", 40),
      linkUrl: linkUrl || null,
      startsAt: startsAt as Date | null,
      endsAt: endsAt as Date | null,
    };

    if (!id) {
      if (!image?.ok) return fail("imageRequired", ["image"]);
      const [{ next }] = await db.select({ next: max(s.promotions.sortOrder) }).from(s.promotions);
      const [created] = await db
        .insert(s.promotions)
        .values({
          ...values,
          imageUrl: image.url,
          imageMobileUrl: mobile?.ok ? mobile.url : null,
          sortOrder: (next ?? 0) + 1,
        })
        .returning();
      await audit(user, "create", "promotion", created.id, null, created);
      refresh();
      return { status: "ok", msg: "saved", at: Date.now() };
    }
    if (!isUuid(id)) return fail("error");
    const before = await db.query.promotions.findFirst({ where: eq(s.promotions.id, id) });
    if (!before) return fail("error");
    const imageUrl = image?.ok ? image.url : before.imageUrl;
    const imageMobileUrl = mobile?.ok
      ? mobile.url
      : flag(data, "removeImageMobile")
        ? null
        : before.imageMobileUrl;
    await db
      .update(s.promotions)
      .set({ ...values, imageUrl, imageMobileUrl })
      .where(eq(s.promotions.id, id));
    if (imageUrl !== before.imageUrl) await deleteStoredFile(before.imageUrl);
    if (imageMobileUrl !== before.imageMobileUrl) await deleteStoredFile(before.imageMobileUrl);
    await audit(user, "update", "promotion", id, before, values);
    refresh();
    return { status: "ok", msg: "saved", at: Date.now() };
  } catch (e) {
    if (e instanceof NotAllowedError) return fail("notAllowed");
    console.error(e);
    return fail("error");
  }
}

export async function setPromotionActive(id: string, active: boolean) {
  const user = await authorize("catalog.content");
  if (!isUuid(id)) return;
  await db.update(s.promotions).set({ isActive: active }).where(eq(s.promotions.id, id));
  await audit(user, active ? "show" : "hide", "promotion", id);
  refresh();
}

export async function deletePromotion(data: FormData) {
  const user = await authorize("catalog.content");
  const id = text(data, "id");
  if (!isUuid(id)) return;
  const [gone] = await db.delete(s.promotions).where(eq(s.promotions.id, id)).returning();
  if (gone) {
    await deleteStoredFile(gone.imageUrl);
    await deleteStoredFile(gone.imageMobileUrl);
    await audit(user, "delete", "promotion", id, gone, null);
  }
  refresh();
}

export async function movePromotion(data: FormData) {
  const user = await authorize("catalog.content");
  const id = text(data, "id");
  const dir = text(data, "dir") === "up" ? -1 : 1;
  if (!isUuid(id)) return;
  const all = await db
    .select()
    .from(s.promotions)
    .orderBy(asc(s.promotions.sortOrder), asc(s.promotions.createdAt));
  const i = all.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await db.transaction(async (tx) => {
    for (const [index, p] of all.entries())
      await tx
        .update(s.promotions)
        .set({ sortOrder: index + 1 })
        .where(eq(s.promotions.id, p.id));
  });
  await audit(user, "reorder", "promotion", id);
  refresh();
}
