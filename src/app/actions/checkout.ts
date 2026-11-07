"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { isBookable } from "@/lib/delivery";
import { isEmail } from "@/lib/email";
import { inUae } from "@/lib/geo";
import { readCartId } from "@/server/cart";
import { getDeliverySetup } from "@/server/checkout";
import { readCustomer } from "@/server/customer/session";
import { db, schema as s } from "@/server/db";

export type CheckoutInput = {
  name: string;
  email: string;
  emailInvoices: boolean;
  fulfilment: "delivery" | "pickup";
  /** A saved address id, or "new". */
  addressChoice: string;
  zoneId: string;
  area: string;
  street: string;
  landmark: string;
  /** Map pin (required for a new delivery address). */
  latitude: number | null;
  longitude: number | null;
  saveAddress: boolean;
  date: string;
  slotId: string;
};

export type CheckoutResult =
  { ok: true } | { ok: false; error: "signIn" | "fix" | "error"; fields?: string[] };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isId = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);

/** Saves the contact details, address (or pick-up) and date/time on the cart, after checking each. */
export async function saveCheckout(raw: CheckoutInput): Promise<CheckoutResult> {
  try {
    const me = await readCustomer();
    const cartId = await readCartId();
    if (!me || !cartId) return { ok: false, error: "signIn" };
    const found = await db.query.carts.findFirst({ where: eq(s.carts.id, cartId) });
    if (!found) return { ok: false, error: "signIn" };
    // The cart in this browser belongs to whoever is signed in here now (e.g. it was filled after signing in).
    const cart =
      found.customerId === me.id ? found : { ...found, customerId: me.id, addressId: null as string | null };
    if (found.customerId !== me.id)
      await db.update(s.carts).set({ customerId: me.id, addressId: null }).where(eq(s.carts.id, cartId));

    const setup = await getDeliverySetup();
    const v = {
      name: clean(raw?.name, 80),
      email: clean(raw?.email, 254).toLowerCase(),
      fulfilment:
        raw?.fulfilment === "pickup" && setup.pickup.enabled ? ("pickup" as const) : ("delivery" as const),
      addressChoice: clean(raw?.addressChoice, 40),
      zoneId: clean(raw?.zoneId, 40),
      area: clean(raw?.area, 80),
      street: clean(raw?.street, 160),
      landmark: clean(raw?.landmark, 160),
      date: clean(raw?.date, 10),
      slotId: clean(raw?.slotId, 40),
    };
    const bad: string[] = [];
    if (v.name.length < 2) bad.push("name");
    if (v.email && !isEmail(v.email)) bad.push("email");

    let addressId: string | null = null;
    if (v.fulfilment === "delivery") {
      if (v.addressChoice && v.addressChoice !== "new") {
        // One of the member's saved addresses
        const saved =
          me.kind === "member" && isId(v.addressChoice)
            ? await db.query.customerAddresses.findFirst({
                where: and(
                  eq(s.customerAddresses.id, v.addressChoice),
                  eq(s.customerAddresses.customerId, me.id),
                  eq(s.customerAddresses.isSaved, true),
                ),
              })
            : undefined;
        if (!saved || !setup.zones.some((z) => z.id === saved.zoneId)) bad.push("addressChoice");
        else addressId = saved.id;
      } else {
        if (!setup.zones.some((z) => z.id === v.zoneId)) bad.push("zoneId");
        if (v.area.length < 2) bad.push("area");
        if (v.street.length < 3) bad.push("street");
        if (!inUae({ lat: raw?.latitude, lng: raw?.longitude })) bad.push("pin");
      }
    }

    const slot = setup.slots.find((x) => x.id === v.slotId);
    const blackouts = new Set(setup.blackouts.map((b) => b.date));
    if (!slot) bad.push("slotId");
    if (!slot || !isBookable(v.date, slot, new Date(), blackouts)) bad.push("date");
    if (bad.length) return { ok: false, error: "fix", fields: bad };

    if (v.fulfilment === "delivery" && !addressId) {
      const fields = {
        zoneId: v.zoneId,
        area: v.area,
        street: v.street,
        landmark: v.landmark,
        latitude: Number((raw.latitude as number).toFixed(6)),
        longitude: Number((raw.longitude as number).toFixed(6)),
        isSaved: me.kind === "member" && !!raw?.saveAddress,
      };
      // Re-use the unsaved address from an earlier try instead of piling up copies.
      const previous = cart.addressId
        ? await db.query.customerAddresses.findFirst({
            where: and(
              eq(s.customerAddresses.id, cart.addressId),
              eq(s.customerAddresses.customerId, me.id),
              eq(s.customerAddresses.isSaved, false),
            ),
          })
        : undefined;
      if (previous) {
        await db.update(s.customerAddresses).set(fields).where(eq(s.customerAddresses.id, previous.id));
        addressId = previous.id;
      } else {
        const [row] = await db
          .insert(s.customerAddresses)
          .values({ customerId: me.id, ...fields })
          .returning({ id: s.customerAddresses.id });
        addressId = row.id;
      }
    }

    await db
      .update(s.customers)
      .set({ name: v.name, email: v.email || null, emailInvoices: !!raw?.emailInvoices && !!v.email })
      .where(eq(s.customers.id, me.id));
    await db
      .update(s.carts)
      .set({ fulfilment: v.fulfilment, addressId, deliveryDate: v.date, slotId: slot!.id })
      .where(eq(s.carts.id, cartId));
    refresh();
    return { ok: true };
  } catch (e) {
    console.error("saveCheckout failed", e);
    return { ok: false, error: "error" };
  }
}
