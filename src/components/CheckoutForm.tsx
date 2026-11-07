"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { saveCheckout, type CheckoutInput } from "@/app/actions/checkout";
import type { Dictionary } from "@/i18n/dictionaries";
import { UAE_CENTRE, type LatLng } from "@/lib/geo";
import { MapPin } from "./MapPin";

type Option = { id: string; label: string };
type Zone = Option & { centre: LatLng | null };

export type CheckoutFormProps = {
  t: Dictionary["checkout"];
  isMember: boolean;
  zones: Zone[];
  lang: string;
  slots: Option[];
  savedAddresses: Option[];
  pickup: { enabled: boolean; address: string };
  minDate: string;
  maxDate: string;
  /** Days without delivery, already formatted for display. */
  blackoutNote: string | null;
  initial: CheckoutInput;
};

function Field({
  label,
  name,
  bad,
  children,
}: {
  label: string;
  name: string;
  bad: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block" data-field={name} data-bad={bad || undefined}>
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

/** Contact details → delivery or pick-up → address → date & time. Every value is re-checked on the server. */
export function CheckoutForm({
  t,
  isMember,
  zones,
  lang,
  slots,
  savedAddresses,
  pickup,
  minDate,
  maxDate,
  blackoutNote,
  initial,
}: CheckoutFormProps) {
  const router = useRouter();
  const [v, setV] = useState<CheckoutInput>(initial);
  const [bad, setBad] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof CheckoutInput>(k: K, value: CheckoutInput[K]) =>
    setV((x) => ({ ...x, [k]: value }));
  const field = (name: string) =>
    `min-h-12 w-full rounded-brand border bg-white px-3 text-base ${
      bad.includes(name) ? "border-danger ring-2 ring-danger/30" : "border-line"
    }`;
  const usingSaved = v.fulfilment === "delivery" && v.addressChoice !== "new" && savedAddresses.length > 0;

  function submit() {
    setMessage(null);
    start(async () => {
      const r = await saveCheckout(v).catch(() => ({ ok: false as const, error: "error" as const }));
      if (r.ok) {
        setBad([]);
        router.refresh();
        setTimeout(
          () => document.getElementById("review")?.scrollIntoView({ behavior: "smooth", block: "start" }),
          300,
        );
        return;
      }
      if (r.error === "signIn") return router.refresh();
      const fields = "fields" in r ? (r.fields ?? []) : [];
      setBad(fields);
      setMessage(
        fields.includes("date")
          ? t.dateUnavailable
          : fields.length === 1 && fields[0] === "email"
            ? t.invalidEmail
            : fields.length === 1 && fields[0] === "pin"
              ? t.pinRequired
              : t.fix,
      );
      setTimeout(
        () => document.querySelector("[data-bad]")?.scrollIntoView({ behavior: "smooth", block: "center" }),
        50,
      );
    });
  }

  const radio = (on: boolean) =>
    `flex min-h-12 cursor-pointer items-center gap-3 border p-3 text-start ${
      on ? "border-green bg-green/5 ring-2 ring-green" : "border-line bg-white hover:border-gold"
    }`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-8"
      data-testid="checkout-form"
      noValidate
    >
      <section className="space-y-3">
        <h2 className="font-display text-xl text-green">{t.stepDetails}</h2>
        <Field label={t.name} name="name" bad={bad.includes("name")}>
          <input
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            className={field("name")}
            name="name"
            required
          />
        </Field>
        <Field label={t.email} name="email" bad={bad.includes("email")}>
          <input
            value={v.email}
            onChange={(e) => set("email", e.target.value)}
            type="email"
            autoComplete="email"
            dir="ltr"
            className={`${field("email")} text-start`}
            name="email"
          />
        </Field>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={v.emailInvoices}
            disabled={!v.email.trim()}
            onChange={(e) => set("emailInvoices", e.target.checked)}
            className="h-5 w-5 accent-green"
            name="emailInvoices"
          />
          {t.emailInvoices}
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-green">{t.stepDelivery}</h2>
        {pickup.enabled ? (
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t.stepDelivery}>
            {(["delivery", "pickup"] as const).map((f) => (
              <label key={f} className={radio(v.fulfilment === f)}>
                <input
                  type="radio"
                  name="fulfilment"
                  value={f}
                  checked={v.fulfilment === f}
                  onChange={() => set("fulfilment", f)}
                  className="h-5 w-5 accent-green"
                />
                {f === "delivery" ? t.delivery : t.pickup}
              </label>
            ))}
          </div>
        ) : null}

        {v.fulfilment === "pickup" ? (
          <p
            className="rounded-brand border border-gold/50 bg-gold/10 px-3 py-2 text-sm"
            data-testid="pickup-address"
          >
            <span className="font-semibold">{t.pickupAddress}: </span>
            {pickup.address || t.pickupTbc}
          </p>
        ) : (
          <>
            {savedAddresses.length ? (
              <div
                className="space-y-2"
                role="radiogroup"
                aria-label={t.savedAddresses}
                data-field="addressChoice"
              >
                <p className="text-xs font-semibold text-muted">{t.savedAddresses}</p>
                {[...savedAddresses, { id: "new", label: t.newAddress }].map((a) => (
                  <label key={a.id} className={radio(v.addressChoice === a.id)} data-testid="address-choice">
                    <input
                      type="radio"
                      name="addressChoice"
                      value={a.id}
                      checked={v.addressChoice === a.id}
                      onChange={() => set("addressChoice", a.id)}
                      className="h-5 w-5 shrink-0 accent-green"
                    />
                    <span className="min-w-0 text-sm">{a.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {!usingSaved ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.emirate} name="zoneId" bad={bad.includes("zoneId")}>
                  <select
                    value={v.zoneId}
                    onChange={(e) => set("zoneId", e.target.value)}
                    className={field("zoneId")}
                    name="zoneId"
                    required
                  >
                    <option value="">{t.chooseEmirate}</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t.area} name="area" bad={bad.includes("area")}>
                  <input
                    value={v.area}
                    onChange={(e) => set("area", e.target.value)}
                    placeholder={t.areaPlaceholder}
                    autoComplete="address-level3"
                    className={field("area")}
                    name="area"
                    required
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={t.street} name="street" bad={bad.includes("street")}>
                    <input
                      value={v.street}
                      onChange={(e) => set("street", e.target.value)}
                      autoComplete="street-address"
                      className={field("street")}
                      name="street"
                      required
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label={t.landmark} name="landmark" bad={false}>
                    <input
                      value={v.landmark}
                      onChange={(e) => set("landmark", e.target.value)}
                      className={field("landmark")}
                      name="landmark"
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <MapPin
                    lang={lang}
                    value={
                      v.latitude != null && v.longitude != null ? { lat: v.latitude, lng: v.longitude } : null
                    }
                    centre={zones.find((z) => z.id === v.zoneId)?.centre ?? UAE_CENTRE}
                    onChange={(p) => setV((x) => ({ ...x, latitude: p.lat, longitude: p.lng }))}
                    invalid={bad.includes("pin")}
                    labels={{
                      title: t.mapTitle,
                      help: t.mapHelp,
                      useMyLocation: t.useMyLocation,
                      locating: t.locating,
                      locationDenied: t.locationDenied,
                      pinSet: t.pinSet,
                      openMap: t.openMap,
                    }}
                  />
                </div>
                {isMember ? (
                  <label className="flex min-h-11 items-center gap-3 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={v.saveAddress}
                      onChange={(e) => set("saveAddress", e.target.checked)}
                      className="h-5 w-5 accent-green"
                      name="saveAddress"
                    />
                    {t.saveAddress}
                  </label>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-green">{t.stepTime}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.date} name="date" bad={bad.includes("date")}>
            <input
              type="date"
              value={v.date}
              min={minDate}
              max={maxDate}
              onChange={(e) => set("date", e.target.value)}
              className={field("date")}
              name="date"
              required
            />
          </Field>
          <Field label={t.slot} name="slotId" bad={bad.includes("slotId")}>
            <select
              value={v.slotId}
              onChange={(e) => set("slotId", e.target.value)}
              className={field("slotId")}
              name="slotId"
              required
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {blackoutNote ? <p className="text-xs text-muted">{blackoutNote}</p> : null}
      </section>

      {message ? (
        <p
          role="alert"
          className="rounded-brand border border-danger/40 px-3 py-2 text-sm text-danger"
          data-testid="checkout-error"
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-brand bg-green px-5 font-semibold text-ivory hover:bg-green-700 disabled:opacity-60"
        data-testid="save-checkout"
      >
        {pending ? t.saving : t.save}
      </button>
    </form>
  );
}
