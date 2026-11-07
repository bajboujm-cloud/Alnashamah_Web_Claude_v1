"use server";

import { and, count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { clampQuantity, MAX_LINES } from "@/lib/pricing";
import {
  ensureCartId,
  getCartCount,
  readCartId,
  resolveLine,
  type LineInput,
  type LineProblem,
} from "@/server/cart";
import { db, schema as s } from "@/server/db";

export type AddResult =
  { ok: true; count: number } | { ok: false; problem: LineProblem | "tooMany" | "invalid" };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Adds one configured animal to the cart after checking every choice against the live catalogue. */
export async function addToCart(raw: LineInput): Promise<AddResult> {
  try {
    return await addLine(raw);
  } catch (e) {
    console.error("addToCart failed", e);
    return { ok: false, problem: "invalid" };
  }
}

async function addLine(raw: LineInput): Promise<AddResult> {
  const occasion = s.occasions.includes(raw?.occasion) ? raw.occasion : "none";
  const input: LineInput = {
    breedOptionId: clean(raw?.breedOptionId, 40),
    cuttingOptionId: clean(raw?.cuttingOptionId, 40) || null,
    packagingOptionId: clean(raw?.packagingOptionId, 40) || null,
    extraIds: Array.isArray(raw?.extraIds) ? raw.extraIds.slice(0, 20).map((x) => clean(x, 40)) : [],
    quantity: clampQuantity(Number(raw?.quantity)),
    occasion,
    onBehalfOf: occasion === "none" ? "" : clean(raw?.onBehalfOf, 120),
    notes: clean(raw?.notes, 500),
  };
  const resolved = await resolveLine(input);
  if (resolved.problem) return { ok: false, problem: resolved.problem };

  const cartId = await ensureCartId();
  const [{ n }] = await db.select({ n: count() }).from(s.cartItems).where(eq(s.cartItems.cartId, cartId));
  if (n >= MAX_LINES) return { ok: false, problem: "tooMany" };
  await db.insert(s.cartItems).values({
    cartId,
    ...input,
    // keep only extras that really exist
    extraIds: resolved.extras!.map((e) => e.id),
  });
  refresh();
  return { ok: true, count: await getCartCount() };
}

/** Only lines of the visitor's own cart can be changed. */
async function ownLine(itemId: string) {
  const cartId = await readCartId();
  if (!cartId || !/^[0-9a-f-]{36}$/.test(itemId)) return null;
  return and(eq(s.cartItems.id, itemId), eq(s.cartItems.cartId, cartId));
}

export async function setCartQuantity(itemId: string, quantity: number) {
  const where = await ownLine(itemId);
  if (!where) return;
  await db
    .update(s.cartItems)
    .set({ quantity: clampQuantity(quantity) })
    .where(where);
  refresh();
}

export async function removeCartItem(itemId: string) {
  const where = await ownLine(itemId);
  if (!where) return;
  await db.delete(s.cartItems).where(where);
  refresh();
}
