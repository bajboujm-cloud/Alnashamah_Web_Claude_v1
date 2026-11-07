import "server-only";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { connection } from "next/server";
import { dubaiToday } from "@/lib/delivery";
import { orderTotals, type PricedLine } from "@/lib/pricing";
import { getCart, readCartId } from "@/server/cart";
import type { SignedInCustomer } from "@/server/customer/session";
import { db, schema as s } from "@/server/db";
import { PICKUP_KEYS } from "@/server/settings";

/** Emirates, time slots, blackout days and pick-up settings for the checkout form. */
export async function getDeliverySetup() {
  await connection();
  const [zones, slots, blackouts, pickupRows] = await Promise.all([
    db
      .select()
      .from(s.deliveryZones)
      .where(eq(s.deliveryZones.isActive, true))
      .orderBy(asc(s.deliveryZones.sortOrder)),
    db
      .select()
      .from(s.deliverySlots)
      .where(eq(s.deliverySlots.isActive, true))
      .orderBy(asc(s.deliverySlots.sortOrder)),
    db
      .select()
      .from(s.deliveryBlackouts)
      .where(gte(s.deliveryBlackouts.date, dubaiToday(new Date())))
      .orderBy(asc(s.deliveryBlackouts.date)),
    db
      .select()
      .from(s.settings)
      .where(inArray(s.settings.key, [...PICKUP_KEYS])),
  ]);
  const get = (k: string) => pickupRows.find((r) => r.key === k)?.value;
  return {
    zones,
    slots,
    blackouts,
    pickup: {
      enabled: get("delivery.pickup_enabled") === true,
      addressEn:
        typeof get("delivery.pickup_address_en") === "string"
          ? (get("delivery.pickup_address_en") as string)
          : "",
      addressAr:
        typeof get("delivery.pickup_address_ar") === "string"
          ? (get("delivery.pickup_address_ar") as string)
          : "",
    },
  };
}

export type DeliverySetup = Awaited<ReturnType<typeof getDeliverySetup>>;

/** The member's address book (newest first). */
export async function savedAddresses(customerId: string) {
  return db.query.customerAddresses.findMany({
    where: and(eq(s.customerAddresses.customerId, customerId), eq(s.customerAddresses.isSaved, true)),
    with: { zone: true },
    orderBy: [desc(s.customerAddresses.updatedAt)],
  });
}

/**
 * Everything the checkout page shows: the live cart, the customer's choices so far and the totals
 * with the delivery fee. A fee that is not decided yet counts as 0 and is flagged "to be confirmed".
 */
export async function getCheckout(customer: SignedInCustomer | null) {
  const [cart, cartId] = await Promise.all([getCart(), readCartId()]);
  const row = cartId ? await db.query.carts.findFirst({ where: eq(s.carts.id, cartId) }) : undefined;
  // Choices only count when they belong to the customer signed in now.
  const mine = !!row && !!customer && row.customerId === customer.id;
  const address =
    mine && row.addressId
      ? await db.query.customerAddresses.findFirst({
          where: and(
            eq(s.customerAddresses.id, row.addressId),
            eq(s.customerAddresses.customerId, customer.id),
          ),
          with: { zone: true },
        })
      : undefined;
  const slot =
    mine && row.slotId
      ? await db.query.deliverySlots.findFirst({ where: eq(s.deliverySlots.id, row.slotId) })
      : undefined;

  const fulfilment = mine ? row.fulfilment : "delivery";
  const feeTbc = fulfilment === "delivery" && (!address || address.zone.feeFils == null);
  const deliveryFils = fulfilment === "pickup" ? 0 : (address?.zone.feeFils ?? 0);
  const ok = cart.lines.filter((l) => !l.problem && l.priced).map((l) => l.priced as PricedLine);
  const totals = orderTotals(ok, deliveryFils, cart.vatPercent, cart.includesVat);

  const ready =
    mine &&
    !!customer.name &&
    !!row.deliveryDate &&
    !!slot &&
    slot.isActive &&
    (fulfilment === "pickup" || (!!address && address.zone.isActive));

  return {
    cart,
    fulfilment,
    address: address ?? null,
    deliveryDate: mine ? row.deliveryDate : null,
    slot: slot ?? null,
    feeTbc,
    totals,
    /** All steps done: the review can be shown. */
    ready,
  };
}
