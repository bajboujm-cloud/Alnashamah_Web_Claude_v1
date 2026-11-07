"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { addToCart, type AddResult } from "@/app/actions/cart";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatAed } from "@/lib/format";
import { MAX_QUANTITY, unitFils } from "@/lib/pricing";

export type BuilderSize = {
  id: string;
  label: string;
  age: string;
  weight: string;
  priceFils: number | null;
  compareAtFils: number | null;
  available: boolean;
};
export type BuilderChoice = {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string | null;
  priceFils: number;
  available: boolean;
  selectedByDefault?: boolean;
};

type Props = {
  lang: Locale;
  t: { order: Dictionary["order"]; catalog: Dictionary["catalog"] };
  inStock: boolean;
  sizes: BuilderSize[];
  cutting: BuilderChoice[];
  extras: BuilderChoice[];
  packaging: BuilderChoice[];
  defaultOccasion?: "none" | "udhiyah";
};

const occasions = ["none", "udhiyah", "aqiqah", "sadaqah", "other"] as const;

function Step({
  n,
  title,
  required,
  children,
}: {
  n: number;
  title: string;
  /** Label of the "Required" tag, shown when this step must be completed. */
  required?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-5">
      <h3 className="font-display mb-3 flex items-center gap-2 text-lg text-green">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm text-green-900">
          {n}
        </span>
        {title}
        {required ? (
          <span
            className="rounded-brand border border-danger/40 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-danger"
            data-testid="required-tag"
          >
            {required}
          </span>
        ) : null}
      </h3>
      {children}
    </section>
  );
}

/** Round ✓ in the corner of the chosen card. */
const Tick = () => (
  <span
    className="absolute end-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-green text-[11px] text-ivory"
    aria-hidden
    data-testid="tick"
  >
    ✓
  </span>
);

/** Step-by-step order: size → cutting → extras → packaging → quantity & notes, with a live total. */
export function OrderBuilder({
  lang,
  t,
  inStock,
  sizes,
  cutting,
  extras,
  packaging,
  defaultOccasion = "none",
}: Props) {
  const o = t.order;
  const firstPackaging = packaging.find((p) => p.available)?.id ?? null;
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [cuttingId, setCuttingId] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<string[]>(
    extras.filter((e) => e.available && e.selectedByDefault).map((e) => e.id),
  );
  const [packagingId, setPackagingId] = useState<string | null>(firstPackaging);
  const [quantity, setQuantity] = useState(1);
  const [occasion, setOccasion] = useState<(typeof occasions)[number]>(defaultOccasion);
  const [onBehalfOf, setOnBehalfOf] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<AddResult | { ok: false; problem: "chooseSize" } | null>(null);
  const [pending, startTransition] = useTransition();

  const size = sizes.find((s) => s.id === sizeId) ?? null;
  const unit = useMemo(
    () =>
      size?.priceFils != null
        ? unitFils({
            sizeFils: size.priceFils,
            cuttingFils: cutting.find((c) => c.id === cuttingId)?.priceFils ?? 0,
            packagingFils: packaging.find((p) => p.id === packagingId)?.priceFils ?? 0,
            extrasFils: extras.filter((e) => extraIds.includes(e.id)).map((e) => e.priceFils),
          })
        : null,
    [size, cuttingId, packagingId, extraIds, cutting, packaging, extras],
  );
  const price = (fils: number) => (fils === 0 ? t.catalog.free : formatAed(fils, lang));
  const plus = (fils: number) => (fils === 0 ? "" : `+ ${formatAed(fils, lang)}`);

  function submit() {
    if (!size) return setResult({ ok: false, problem: "chooseSize" });
    startTransition(async () => {
      setResult(
        await addToCart({
          breedOptionId: size.id,
          cuttingOptionId: cuttingId,
          packagingOptionId: packagingId,
          extraIds,
          quantity,
          occasion,
          onBehalfOf,
          notes,
        }),
      );
    });
  }

  const cardClass = (selected: boolean, available: boolean) =>
    `relative flex items-center gap-3 border p-3 pe-8 text-start transition-colors ${
      !available
        ? "cursor-not-allowed border-line bg-ivory/60 text-muted"
        : selected
          ? "border-green bg-green/5 ring-2 ring-green"
          : "border-line bg-white hover:border-gold"
    }`;

  return (
    <div className="min-w-0 space-y-6" data-testid="order-builder">
      <h2 className="font-display text-2xl text-green">{o.title}</h2>
      {!inStock ? <p className="text-sm font-semibold text-danger">{o.outOfStockNote}</p> : null}

      <Step n={1} title={o.stepSize} required={o.required}>
        <div className="grid gap-2" role="radiogroup" aria-label={o.stepSize}>
          {sizes.map((s) => {
            const can = s.available && s.priceFils != null;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={sizeId === s.id}
                disabled={!can}
                onClick={() => setSizeId(s.id)}
                className={`${cardClass(sizeId === s.id, can)} w-full`}
                data-testid="option-row"
                data-available={s.available}
              >
                {sizeId === s.id ? <Tick /> : null}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-green">
                    {s.label}
                    {!s.available ? (
                      <span className="rounded-brand border border-danger/40 px-2 py-0.5 text-xs text-danger">
                        {t.catalog.outOfStock}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {t.catalog.age}: {s.age} · {t.catalog.weight}: {s.weight}
                  </span>
                </span>
                <span className="shrink-0 text-end font-semibold text-green">
                  {s.priceFils != null ? (
                    <>
                      {s.compareAtFils != null && s.compareAtFils > s.priceFils ? (
                        <s className="me-1 block text-xs font-normal text-muted">
                          {formatAed(s.compareAtFils, lang)}
                        </s>
                      ) : null}
                      {formatAed(s.priceFils, lang)}
                    </>
                  ) : (
                    <span className="text-xs font-normal text-muted">{t.catalog.priceSoon}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Step>

      {cutting.length ? (
        <Step
          n={2}
          title={o.stepCutting}
          required={cutting.some((c) => c.available) ? o.required : undefined}
        >
          <div
            className="flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible"
            role="radiogroup"
            aria-label={o.stepCutting}
            data-testid="cutting-list"
          >
            {cutting.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={cuttingId === c.id}
                disabled={!c.available}
                onClick={() => setCuttingId(c.id)}
                className={`${cardClass(cuttingId === c.id, c.available)} w-36 shrink-0 snap-start flex-col items-stretch sm:w-full`}
                data-testid="cutting-choice"
              >
                {cuttingId === c.id ? <Tick /> : null}
                {c.photoUrl ? (
                  <span className="relative block aspect-[4/3] w-full overflow-hidden bg-ivory-200">
                    <Image
                      src={c.photoUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover"
                    />
                  </span>
                ) : null}
                <span className="text-sm font-semibold text-green">{c.name}</span>
                <span className="text-xs text-muted">
                  {c.available ? plus(c.priceFils) : t.catalog.outOfStock}
                </span>
              </button>
            ))}
          </div>
        </Step>
      ) : null}

      {extras.length ? (
        <Step n={3} title={o.stepExtras}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {extras.map((e) => (
              <label
                key={e.id}
                className={`flex min-h-11 items-center gap-2 border p-3 text-sm ${
                  e.available ? "border-line bg-white" : "border-line bg-ivory/60 text-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-green"
                  disabled={!e.available}
                  checked={extraIds.includes(e.id)}
                  onChange={(ev) =>
                    setExtraIds((ids) => (ev.target.checked ? [...ids, e.id] : ids.filter((x) => x !== e.id)))
                  }
                  data-testid="extra-choice"
                />
                <span>
                  {e.name} <span className="text-xs text-muted">{plus(e.priceFils)}</span>
                </span>
              </label>
            ))}
          </div>
        </Step>
      ) : null}

      {packaging.length ? (
        <Step
          n={4}
          title={o.stepPackaging}
          required={packaging.some((p) => p.available) ? o.required : undefined}
        >
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={o.stepPackaging}>
            {packaging.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={packagingId === p.id}
                disabled={!p.available}
                onClick={() => setPackagingId(p.id)}
                className={`${cardClass(packagingId === p.id, p.available)} w-full flex-col items-stretch`}
                data-testid="packaging-choice"
              >
                {packagingId === p.id ? <Tick /> : null}
                {p.photoUrl ? (
                  <span className="relative block aspect-[4/3] w-full overflow-hidden bg-ivory-200">
                    <Image
                      src={p.photoUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 33vw, 160px"
                      className="object-cover"
                    />
                  </span>
                ) : null}
                <span className="text-sm font-semibold leading-snug text-green">{p.name}</span>
                <span className="text-xs">{p.available ? price(p.priceFils) : t.catalog.outOfStock}</span>
              </button>
            ))}
          </div>
        </Step>
      ) : null}

      <Step n={5} title={o.stepDetails}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-xs font-semibold text-muted">{o.quantity}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="−"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-11 w-11 rounded-brand border border-line bg-white text-lg text-green"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-semibold" data-testid="quantity">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                className="h-11 w-11 rounded-brand border border-line bg-white text-lg text-green"
              >
                +
              </button>
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{o.occasion}</span>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value as (typeof occasions)[number])}
              className="min-h-11 w-full rounded-brand border border-line bg-white px-3 text-sm"
              name="occasion"
            >
              {occasions.map((x) => (
                <option key={x} value={x}>
                  {o.occasions[x]}
                </option>
              ))}
            </select>
          </label>
          {occasion !== "none" ? (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-muted">{o.onBehalfOf}</span>
              <input
                value={onBehalfOf}
                onChange={(e) => setOnBehalfOf(e.target.value)}
                maxLength={120}
                name="onBehalfOf"
                className="min-h-11 w-full rounded-brand border border-line bg-white px-3 text-sm"
              />
            </label>
          ) : null}
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-muted">{o.notes}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder={o.notesPlaceholder}
              name="notes"
              className="w-full rounded-brand border border-line bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
      </Step>

      {/* Sticky total + add button (stays visible while choosing on phones). */}
      <div className="sticky bottom-16 z-20 -mx-4 border-t-2 border-gold bg-green px-4 py-3 text-ivory sm:mx-0 md:bottom-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ivory/75">{o.total}</p>
            <p className="font-serif text-xl" data-testid="builder-total">
              {unit != null ? formatAed(unit * quantity, lang) : "—"}
            </p>
            {unit != null && quantity > 1 ? (
              <p className="text-xs text-ivory/75">
                {formatAed(unit, lang)} {o.perAnimal}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !inStock}
            className="min-h-11 rounded-brand bg-gold px-5 py-2 font-semibold text-green-900 hover:bg-ivory disabled:opacity-60"
            data-testid="add-to-cart"
          >
            {pending ? o.adding : o.add}
          </button>
        </div>
        {result ? (
          <p role={result.ok ? "status" : "alert"} className="mt-2 text-sm" data-testid="builder-message">
            {result.ok ? (
              <>
                {o.added}{" "}
                <Link href={`/${lang}/cart`} className="font-semibold text-gold underline">
                  {o.viewCart}
                </Link>
              </>
            ) : result.problem === "chooseSize" ? (
              o.chooseSize
            ) : (
              o.problems[result.problem]
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
