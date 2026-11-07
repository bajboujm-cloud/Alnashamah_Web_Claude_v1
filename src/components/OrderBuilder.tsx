"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { addToCart, type AddResult } from "@/app/actions/cart";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatAed } from "@/lib/format";
import { MAX_QUANTITY, unitFils } from "@/lib/pricing";
import { ageRuleApplies, isTooYoung } from "@/lib/sacrifice";

export type BuilderSize = {
  id: string;
  label: string;
  age: string;
  weight: string;
  priceFils: number | null;
  compareAtFils: number | null;
  available: boolean;
  /** Youngest age of this size in months (for the Udhiyah / Aqiqah age rule). */
  ageMin?: number | null;
};
export type BuilderChoice = {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string | null;
  priceFils: number;
  available: boolean;
  selectedByDefault?: boolean;
  /** Shown instead of "out of stock" when switched off (e.g. Eid slaughterhouse rules). */
  unavailableNote?: string;
};

type Props = {
  lang: Locale;
  t: { order: Dictionary["order"]; catalog: Dictionary["catalog"] };
  inStock: boolean;
  sizes: BuilderSize[];
  cutting: BuilderChoice[];
  extras: BuilderChoice[];
  packaging: BuilderChoice[];
  defaultOccasion?: (typeof occasions)[number];
  /** Occasion → message, for occasions whose orders can't include head, intestines, tripe … (e.g. Eid). */
  noExtras?: Record<string, string>;
  /** Udhiyah / Aqiqah minimum age for this category, with the message to show (e.g. sheep 6+ months). */
  ageRule?: { minMonths: number; message: string } | null;
  /** Where "Choose another breed" goes when no size of this breed is old enough. */
  otherBreedsHref?: string;
};

const occasions = ["none", "udhiyah", "aqiqah", "sadaqah", "other"] as const;

function Step({
  n,
  id,
  title,
  required,
  missing = false,
  children,
}: {
  n: number;
  /** Anchor used to scroll to this step when something is missing. */
  id?: string;
  title: string;
  /** Label of the "Required" tag, shown when this step must be completed. */
  required?: string;
  /** True while the customer tried to add to cart without choosing here. */
  missing?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-line pt-5 data-[missing=true]:rounded-brand data-[missing=true]:bg-danger/5 data-[missing=true]:ring-2 data-[missing=true]:ring-danger/40"
      data-missing={missing}
    >
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

/** Large photo of a cutting option. Optional: customers can also just tap the card. */
function PhotoDialog({
  choice,
  labels,
  price,
  onChoose,
  onClose,
}: {
  choice: BuilderChoice;
  labels: { choose: string; close: string };
  price: string;
  onChoose: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // tap outside to close
      aria-label={choice.name}
      className="m-auto w-[min(92vw,40rem)] border-t-4 border-gold bg-white p-0 backdrop:bg-charcoal/70"
      data-testid="cutting-dialog"
    >
      <div className="relative aspect-[4/3] w-full bg-ivory-200">
        {choice.photoUrl ? (
          <Image
            src={choice.photoUrl}
            alt={choice.name}
            fill
            sizes="(max-width: 700px) 92vw, 640px"
            className="object-contain"
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-display text-lg text-green">{choice.name}</p>
          {price ? <p className="text-sm text-muted">{price}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-brand border border-line px-4 text-sm text-green"
          >
            {labels.close}
          </button>
          {choice.available ? (
            <button
              type="button"
              onClick={onChoose}
              className="min-h-11 rounded-brand bg-green px-4 text-sm font-semibold text-ivory"
              data-testid="cutting-dialog-choose"
            >
              {labels.choose}
            </button>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

/** Popup when Add to cart is pressed with a size too young for an Udhiyah / Aqiqah, with one-tap fixes. */
function AgeDialog({
  title,
  message,
  pickLabel,
  noSizeLabel,
  otherBreed,
  notSacrificeLabel,
  closeLabel,
  onPick,
  onNotSacrifice,
  onClose,
}: {
  title: string;
  message: string;
  /** Button text for the nearest size that is old enough; null when there is none. */
  pickLabel: string | null;
  noSizeLabel: string;
  otherBreed: { label: string; href: string } | null;
  notSacrificeLabel: string;
  closeLabel: string;
  onPick: () => void;
  onNotSacrifice: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // tap outside to close
      aria-labelledby="age-dialog-title"
      className="m-auto w-[min(92vw,28rem)] rounded-brand border-t-4 border-danger bg-white p-0 backdrop:bg-charcoal/70"
      data-testid="age-dialog"
    >
      <div className="relative p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute end-2 top-2 flex h-11 w-11 items-center justify-center text-xl text-muted hover:text-green"
          data-testid="age-dialog-close"
        >
          ×
        </button>
        <h3 id="age-dialog-title" className="font-display pe-10 text-xl text-danger">
          {title}
        </h3>
        <p className="mt-2 text-sm text-charcoal" data-testid="age-dialog-message">
          {message}
        </p>
        {!pickLabel ? <p className="mt-1 text-sm text-muted">{noSizeLabel}</p> : null}
        <div className="mt-5 grid gap-2">
          {pickLabel ? (
            <button
              type="button"
              onClick={onPick}
              className="min-h-11 rounded-brand bg-green px-4 py-2 text-sm font-semibold text-ivory hover:bg-green-700"
              data-testid="age-dialog-pick"
            >
              {pickLabel}
            </button>
          ) : otherBreed ? (
            <Link
              href={otherBreed.href}
              className="flex min-h-11 items-center justify-center rounded-brand bg-green px-4 py-2 text-sm font-semibold text-ivory hover:bg-green-700"
              data-testid="age-dialog-other-breed"
            >
              {otherBreed.label}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onNotSacrifice}
            className="min-h-11 rounded-brand border border-green px-4 py-2 text-sm font-semibold text-green hover:bg-green/5"
            data-testid="age-dialog-not-sacrifice"
          >
            {notSacrificeLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

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
  noExtras = {},
  ageRule = null,
  otherBreedsHref,
}: Props) {
  const o = t.order;
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [cuttingId, setCuttingId] = useState<string | null>(null);
  const [extraIds, setExtraIds] = useState<string[]>(
    noExtras[defaultOccasion]
      ? []
      : extras.filter((e) => e.available && e.selectedByDefault).map((e) => e.id), // none ticked unless set in the admin
  );
  const [packagingId, setPackagingId] = useState<string | null>(null); // customer must choose
  const [quantity, setQuantity] = useState(1);
  const [occasion, setOccasion] = useState<(typeof occasions)[number]>(defaultOccasion);
  const [onBehalfOf, setOnBehalfOf] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<AddResult | { ok: false; problem: "chooseSize" } | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  /** Cutting option whose photo is shown large (optional — tapping a card still selects it directly). */
  const [zoom, setZoom] = useState<BuilderChoice | null>(null);
  const [pending, startTransition] = useTransition();

  const size = sizes.find((s) => s.id === sizeId) ?? null;
  /** Udhiyah / Aqiqah chosen and this category has a minimum age. */
  const ageRuleOn = !!ageRule && ageRuleApplies(occasion, ageRule.minMonths);
  const tooYoung = (s: BuilderSize) => !!ageRule && isTooYoung(occasion, ageRule.minMonths, s.ageMin);
  const sizeTooYoung = !!size && tooYoung(size);
  /** Popup shown when Add to cart is pressed with a size that is too young. */
  /** Age popup; `tapped` = the too-young size the customer just tapped (not selected unless they confirm). */
  const [ageDialog, setAgeDialog] = useState<{ tapped: BuilderSize | null } | null>(null);
  /** Nearest size (in list order) that is old enough and can be ordered. */
  const olderSize = sizes.find((s) => s.available && s.priceFils != null && !tooYoung(s)) ?? null;
  /** Message when the chosen occasion can't include head, intestines, tripe … (e.g. Eid sacrifices). */
  const occasionNote = noExtras[occasion] ?? null;
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

  /** Shows the message and scrolls to the step that still needs a choice. */
  function needs(
    step: "step-size" | "step-cutting" | "step-packaging",
    problem: "chooseSize" | "tooYoung" | "chooseCutting" | "choosePackaging",
  ) {
    setResult({ ok: false, problem } as AddResult);
    setMissing(step);
    document.getElementById(step)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submit() {
    if (!size) return needs("step-size", "chooseSize");
    if (sizeTooYoung) {
      setResult(null);
      setAgeDialog({ tapped: null });
      return;
    }
    if (cutting.some((c) => c.available) && !cuttingId) return needs("step-cutting", "chooseCutting");
    if (packaging.some((p) => p.available) && !packagingId) return needs("step-packaging", "choosePackaging");
    setMissing(null);
    startTransition(async () => {
      try {
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
      } catch {
        // e.g. the connection dropped or the server had a problem: show a friendly message, not a crash
        setResult({ ok: false, problem: "invalid" });
      }
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

      <Step
        n={1}
        id="step-size"
        title={o.stepSize}
        required={o.required}
        missing={missing === "step-size" && (!sizeId || sizeTooYoung)}
      >
        {ageRuleOn && ageRule ? (
          // Sharia age rule: shown as a hint, and in red once a size that is too young is chosen.
          <p
            className={`mb-3 rounded-brand border px-3 py-2 text-sm ${
              sizeTooYoung
                ? "border-danger/50 bg-danger/5 font-semibold text-danger"
                : "border-gold/50 bg-gold/10 text-charcoal"
            }`}
            role={sizeTooYoung ? "alert" : undefined}
            data-testid="age-rule"
            data-error={sizeTooYoung}
          >
            {ageRule.message}
          </p>
        ) : null}
        <div className="grid gap-2" role="radiogroup" aria-label={o.stepSize}>
          {sizes.map((s) => {
            const can = s.available && s.priceFils != null;
            const young = can && tooYoung(s);
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={sizeId === s.id}
                disabled={!can}
                onClick={() => {
                  // Too young for the chosen Udhiyah / Aqiqah: explain straight away instead of selecting it.
                  if (young) return setAgeDialog({ tapped: s });
                  setSizeId(s.id);
                }}
                className={`${
                  young && sizeId === s.id
                    ? "relative flex items-center gap-3 border border-danger bg-danger/5 p-3 pe-8 text-start ring-2 ring-danger"
                    : cardClass(sizeId === s.id, can)
                } w-full`}
                data-testid="option-row"
                data-available={s.available}
                data-too-young={young || undefined}
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
                    {young ? (
                      <span
                        className="rounded-brand border border-danger/40 px-2 py-0.5 text-xs font-normal text-danger"
                        data-testid="too-young-tag"
                      >
                        {o.tooYoungTag}
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
          id="step-cutting"
          missing={missing === "step-cutting" && !cuttingId}
          title={o.stepCutting}
          required={cutting.some((c) => c.available) ? o.required : undefined}
        >
          {cutting.some((c) => c.photoUrl) ? (
            <p className="-mt-1 mb-2 text-xs text-muted" data-testid="zoom-hint">
              {o.zoomHint}
            </p>
          ) : null}
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label={o.stepCutting}
            data-testid="cutting-list"
          >
            {cutting.map((c) => (
              <div key={c.id} className="relative">
                <button
                  type="button"
                  role="radio"
                  aria-checked={cuttingId === c.id}
                  disabled={!c.available}
                  onClick={() => setCuttingId(c.id)}
                  className={`${cardClass(cuttingId === c.id, c.available)} h-full w-full flex-col items-stretch`}
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
                    {c.available ? plus(c.priceFils) : c.unavailableNote || o.notAvailable}
                  </span>
                </button>
                {c.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => setZoom(c)}
                    aria-label={`${o.viewPhoto}: ${c.name}`}
                    className="absolute start-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-green/85 text-ivory hover:bg-green"
                    data-testid="cutting-zoom"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5M11 8v6M8 11h6" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </Step>
      ) : null}

      {extras.length ? (
        <Step n={3} title={o.stepExtras}>
          {/* For some occasions (e.g. Eid Al-Adha sacrifices) these can't be chosen at all. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {extras.map((e) => (
              <label
                key={e.id}
                className={`flex min-h-11 items-center gap-2 border p-3 text-sm ${
                  e.available && !occasionNote ? "border-line bg-white" : "border-line bg-ivory/60 text-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-green"
                  disabled={!e.available || !!occasionNote}
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
          {occasionNote ? (
            <div
              className="mt-2 rounded-brand border border-gold/60 bg-gold/10 p-3 text-sm text-charcoal"
              data-testid="extras-note"
            >
              <p>{occasionNote}</p>
            </div>
          ) : extras.some((e) => !e.available) ? (
            <div
              className="mt-2 rounded-brand border border-gold/60 bg-gold/10 p-3 text-sm text-charcoal"
              data-testid="extras-note"
            >
              {[
                ...new Set(
                  extras.filter((e) => !e.available).map((e) => e.unavailableNote || o.notAvailable),
                ),
              ].map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          ) : null}
        </Step>
      ) : null}

      {packaging.length ? (
        <Step
          n={4}
          id="step-packaging"
          missing={missing === "step-packaging" && !packagingId}
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
                <span className="text-xs">
                  {p.available ? price(p.priceFils) : p.unavailableNote || o.notAvailable}
                </span>
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
              onChange={(e) => {
                const next = e.target.value as (typeof occasions)[number];
                setOccasion(next);
                if (noExtras[next]) setExtraIds([]);
                // The chosen size is too young for the new occasion: explain straight away.
                if (size && ageRule && isTooYoung(next, ageRule.minMonths, size.ageMin))
                  setAgeDialog({ tapped: null });
              }}
              className="min-h-11 w-full rounded-brand border border-line bg-white px-3 text-sm"
              name="occasion"
            >
              {occasions.map((x) => (
                <option key={x} value={x}>
                  {o.occasions[x]}
                </option>
              ))}
            </select>
            {sizeTooYoung && ageRule ? (
              <span className="mt-1 block text-sm font-semibold text-danger" data-testid="age-rule-occasion">
                {ageRule.message}
              </span>
            ) : null}
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

      {ageDialog && ageRule ? (
        <AgeDialog
          title={o.ageDialogTitle}
          message={ageRule.message}
          pickLabel={
            olderSize
              ? o.ageDialogPick
                  .replace("{size}", olderSize.label)
                  .replace("{age}", olderSize.age)
                  .replace("{price}", formatAed(olderSize.priceFils as number, lang))
              : null
          }
          noSizeLabel={o.ageDialogNoSize}
          otherBreed={otherBreedsHref ? { label: o.ageDialogOtherBreed, href: otherBreedsHref } : null}
          notSacrificeLabel={o.ageDialogNotSacrifice}
          closeLabel={o.close}
          onPick={() => {
            if (olderSize) setSizeId(olderSize.id);
            setMissing(null);
            setAgeDialog(null);
          }}
          onNotSacrifice={() => {
            setOccasion("none");
            if (ageDialog.tapped) setSizeId(ageDialog.tapped.id); // they wanted this size for a normal order
            setMissing(null);
            setAgeDialog(null);
          }}
          onClose={() => setAgeDialog(null)}
        />
      ) : null}
      {zoom ? (
        <PhotoDialog
          choice={zoom}
          labels={{ choose: o.chooseThisCut, close: o.close }}
          price={zoom.available ? plus(zoom.priceFils) : zoom.unavailableNote || o.notAvailable}
          onChoose={() => {
            setCuttingId(zoom.id);
            setZoom(null);
          }}
          onClose={() => setZoom(null)}
        />
      ) : null}

      {/* Sticky total + add button (stays visible while choosing on phones). */}
      <div
        data-order-bar
        className="sticky bottom-16 z-20 -mx-4 border-t-2 border-gold bg-green px-4 py-3 text-ivory sm:mx-0 md:bottom-0"
      >
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
            ) : result.problem === "tooYoung" && ageRule ? (
              `${ageRule.message} ${o.problems.tooYoung}`
            ) : (
              o.problems[result.problem]
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
