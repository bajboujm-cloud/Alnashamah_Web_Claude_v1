import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { isOptionAvailable } from "@/lib/availability";
import { isTooYoung } from "@/lib/sacrifice";
import { cartTotals, clampQuantity, lineFils, unitFils, type PricedLine } from "@/lib/pricing";
import { db, schema as s } from "@/server/db";
import { env } from "@/server/env";
import { noExtrasOccasions } from "@/server/occasion-rules";

/**
 * Shopping cart. The cart id lives in an httpOnly cookie; every line is re-checked against the live
 * catalogue each time it is read, so prices and stock shown in the cart are always current.
 */
export const CART_COOKIE = env.NODE_ENV === "production" ? "__Host-nsh_cart" : "nsh_cart";
const CART_DAYS = 30;
const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);

export async function readCartId(): Promise<string | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  return isUuid(id) ? id : null;
}

/** Returns the visitor's cart id, creating the cart (and cookie) if needed. Server Actions only. */
export async function ensureCartId(): Promise<string> {
  const existing = await readCartId();
  if (existing) {
    const [row] = await db.select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.id, existing));
    if (row) return row.id;
  }
  const [cart] = await db.insert(s.carts).values({}).returning({ id: s.carts.id });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_DAYS * 86_400,
  });
  return cart.id;
}

/* ------------------------------ choices for a breed ------------------------------ */

/** Cutting options (for the breed's category), extras and packaging, in display order. */
export async function getOrderChoices(categoryId: string) {
  const [cutting, extras, packaging] = await Promise.all([
    db
      .select({ c: s.cuttingOptions })
      .from(s.cuttingOptions)
      .innerJoin(
        s.cuttingOptionCategories,
        eq(s.cuttingOptionCategories.cuttingOptionId, s.cuttingOptions.id),
      )
      .where(eq(s.cuttingOptionCategories.categoryId, categoryId))
      .orderBy(asc(s.cuttingOptions.sortOrder))
      .then((rows) => rows.map((r) => r.c)),
    db.select().from(s.extras).orderBy(asc(s.extras.sortOrder)),
    db.select().from(s.packagingOptions).orderBy(asc(s.packagingOptions.sortOrder)),
  ]);
  return { cutting, extras, packaging };
}

/* ---------------------------------- one line ---------------------------------- */

export type LineInput = {
  breedOptionId: string;
  cuttingOptionId: string | null;
  packagingOptionId: string | null;
  extraIds: string[];
  quantity: number;
  occasion: (typeof s.occasions)[number];
  onBehalfOf: string;
  notes: string;
};

export type LineProblem =
  "unavailable" | "noPrice" | "tooYoung" | "chooseCutting" | "choosePackaging" | "choiceUnavailable";

/** Checks a line against the live catalogue and prices it. */
export async function resolveLine(input: LineInput) {
  if (!isUuid(input.breedOptionId)) return { problem: "unavailable" as LineProblem };
  const option = await db.query.breedOptions.findFirst({
    where: eq(s.breedOptions.id, input.breedOptionId),
    with: { breed: { with: { category: true } } },
  });
  if (!option) return { problem: "unavailable" as LineProblem };
  const { breed } = option;
  const choices = await getOrderChoices(breed.categoryId);

  let problem: LineProblem | null = null;
  if (breed.category.status !== "active" || !breed.isVisible || !isOptionAvailable(breed, option))
    problem = "unavailable";
  else if (option.priceFils == null) problem = "noPrice";
  // Udhiyah / Aqiqah must reach the category's minimum age (e.g. sheep 6+ months, goats 12+ months).
  else if (isTooYoung(input.occasion, breed.category.sacrificeMinAgeMonths, option.ageMinMonths))
    problem = "tooYoung";

  const cutting = choices.cutting.find((c) => c.id === input.cuttingOptionId) ?? null;
  const packaging = choices.packaging.find((p) => p.id === input.packagingOptionId) ?? null;
  // Some occasions (e.g. Eid Al-Adha sacrifices) never include head, intestines, tripe …
  const noExtras = (await noExtrasOccasions()).some((r) => r.occasion === input.occasion);
  const extras = noExtras ? [] : choices.extras.filter((e) => input.extraIds.includes(e.id));
  if (!problem) {
    if (choices.cutting.some((c) => c.isAvailable) && !cutting) problem = "chooseCutting";
    else if (choices.packaging.some((p) => p.isAvailable) && !packaging) problem = "choosePackaging";
    else if (
      (cutting && !cutting.isAvailable) ||
      (packaging && !packaging.isAvailable) ||
      extras.some((e) => !e.isAvailable)
    )
      problem = "choiceUnavailable";
  }

  const priced: PricedLine = {
    sizeFils: option.priceFils ?? 0,
    cuttingFils: cutting?.priceFils ?? 0,
    packagingFils: packaging?.priceFils ?? 0,
    extrasFils: extras.map((e) => e.priceFils),
    quantity: clampQuantity(input.quantity),
  };
  return { problem, option, breed, cutting, packaging, extras, priced };
}

/* ----------------------------------- cart ----------------------------------- */

async function vatSettings() {
  const rows = await db
    .select()
    .from(s.settings)
    .where(inArray(s.settings.key, ["tax.vat_rate_percent", "tax.prices_include_vat"]));
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  const rate = Number(get("tax.vat_rate_percent") ?? 5);
  return {
    vatPercent: Number.isFinite(rate) ? rate : 5,
    includesVat: get("tax.prices_include_vat") !== false,
  };
}

export async function getCart() {
  const cartId = await readCartId();
  const items = cartId
    ? await db
        .select()
        .from(s.cartItems)
        .where(eq(s.cartItems.cartId, cartId))
        .orderBy(asc(s.cartItems.createdAt))
    : [];
  const lines = await Promise.all(
    items.map(async (item) => {
      const r = await resolveLine({ ...item, quantity: item.quantity });
      return {
        item,
        problem: r.problem,
        option: "option" in r ? r.option : null,
        breed: "breed" in r ? r.breed : null,
        cutting: "cutting" in r ? r.cutting : null,
        packaging: "packaging" in r ? r.packaging : null,
        extras: "extras" in r ? (r.extras ?? []) : [],
        unitFils: "priced" in r && r.priced ? unitFils(r.priced) : 0,
        lineFils: "priced" in r && r.priced ? lineFils(r.priced) : 0,
        priced: "priced" in r ? r.priced : undefined,
      };
    }),
  );
  const { vatPercent, includesVat } = await vatSettings();
  const ok = lines.filter((l) => !l.problem && l.priced);
  const totals = cartTotals(
    ok.map((l) => l.priced as PricedLine),
    vatPercent,
    includesVat,
  );
  return {
    lines,
    totals,
    vatPercent,
    includesVat,
    count: lines.reduce((n, l) => n + l.item.quantity, 0),
    canCheckout: ok.length > 0 && ok.length === lines.length,
  };
}

export type Cart = Awaited<ReturnType<typeof getCart>>;

/** Number of animals in the cart (for the header badge). */
export async function getCartCount() {
  const cartId = await readCartId();
  if (!cartId) return 0;
  const rows = await db
    .select({ q: s.cartItems.quantity })
    .from(s.cartItems)
    .where(and(eq(s.cartItems.cartId, cartId)));
  return rows.reduce((n, r) => n + r.q, 0);
}
