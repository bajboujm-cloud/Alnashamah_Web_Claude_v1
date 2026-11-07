"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { confirmCode, sendCode } from "@/app/actions/customer";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { DEFAULT_COUNTRY, maskPhone, PHONE_COUNTRIES } from "@/lib/phone";
import { WithPhone } from "./WithPhone";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string;
      reset: (id?: string) => void;
    };
  }
}

type Mode = "member" | "guest";

/** "AE" → 🇦🇪 (country names are read out by screen readers through the select's label). */
const flag = (iso: string) => String.fromCodePoint(...[...iso].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));

/**
 * Mobile number → one-time code. With `allowGuest`, the customer first picks "Sign in" (account,
 * saved addresses) or "Continue as guest" (number verified for this order only).
 */
export function PhoneSignIn({
  lang,
  t,
  allowGuest = false,
  redirectTo,
  turnstileSiteKey,
}: {
  lang: Locale;
  t: Dictionary["signIn"];
  allowGuest?: boolean;
  /** Where to go after signing in; by default the current page reloads its data. */
  redirectTo?: string;
  turnstileSiteKey?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("member");
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [pending, start] = useTransition();
  const [botToken, setBotToken] = useState<string | undefined>();
  const botBox = useRef<HTMLDivElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);

  // Bot check (Cloudflare Turnstile) — only when a site key is configured.
  useEffect(() => {
    if (!turnstileSiteKey || !botBox.current) return;
    const el = botBox.current;
    const render = () => window.turnstile?.render(el, { sitekey: turnstileSiteKey, callback: setBotToken });
    if (window.turnstile) render();
    else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const fill = (text: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);

  function requestCode() {
    setError(null);
    start(async () => {
      const r = await sendCode({ phone, country, botToken }).catch(() => ({
        ok: false as const,
        error: "error" as const,
      }));
      if (r.ok) {
        setSentTo(r.phone);
        setDevCode(r.devCode);
        setCode("");
        setWait(30);
        setTimeout(() => codeInput.current?.focus(), 50);
      } else {
        const s = "retryAfterSec" in r ? (r.retryAfterSec ?? 0) : 0;
        if (r.error === "tooSoon") setWait(s);
        setError(fill(t[r.error], { s }));
        if (r.error === "botCheck") window.turnstile?.reset();
      }
    });
  }

  function confirm() {
    if (!sentTo) return;
    setError(null);
    start(async () => {
      const r = await confirmCode({ phone: sentTo, country, code, mode }).catch(() => ({
        ok: false as const,
        error: "error" as const,
      }));
      if (r.ok) {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        setError(fill(t[r.error], { n: "attemptsLeft" in r ? (r.attemptsLeft ?? 0) : 0 }));
        if (r.error === "expired" || r.error === "locked") setCode("");
      }
    });
  }

  const field = "min-h-12 w-full rounded-brand border border-line bg-white px-3 text-base";

  return (
    <div className="space-y-5" data-testid="phone-sign-in">
      {allowGuest && !sentTo ? (
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t.title}>
          {(["member", "guest"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`relative border p-4 text-start transition-colors ${
                mode === m
                  ? "border-green bg-green/5 ring-2 ring-green"
                  : "border-line bg-white hover:border-gold"
              }`}
              data-testid={`mode-${m}`}
            >
              <span className="font-display block text-lg text-green">
                {m === "member" ? t.member : t.guest}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {m === "member" ? t.memberHelp : t.guestHelp}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {!sentTo ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            requestCode();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-[8.5rem_1fr] gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{t.country}</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={field}
                dir="ltr"
                name="country"
              >
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} title={lang === "ar" ? c.nameAr : c.nameEn}>
                    {flag(c.iso)} +{c.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">{t.phone}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={t.phonePlaceholder}
                required
                dir="ltr"
                className={`${field} text-start`}
                name="phone"
              />
            </label>
          </div>
          {turnstileSiteKey ? <div ref={botBox} /> : null}
          <button
            type="submit"
            disabled={pending || !phone.trim()}
            className="min-h-12 w-full rounded-brand bg-green px-5 font-semibold text-ivory hover:bg-green-700 disabled:opacity-60"
            data-testid="send-code"
          >
            {pending ? t.sending : t.sendCode}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          className="space-y-3"
        >
          <p className="text-sm text-charcoal" data-testid="code-sent">
            <WithPhone text={t.codeSent} phone={maskPhone(sentTo)} />
          </p>
          {devCode ? (
            <p
              className="rounded-brand border border-dashed border-gold bg-gold/10 px-3 py-2 text-sm"
              data-testid="dev-code"
            >
              {fill(t.devCode, { code: devCode })}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{t.code}</span>
            <input
              ref={codeInput}
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // Arabic digits
                    .replace(/\D/g, "")
                    .slice(0, 6),
                )
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              dir="ltr"
              className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
              name="code"
              data-testid="code-input"
            />
          </label>
          <button
            type="submit"
            disabled={pending || code.length !== 6}
            className="min-h-12 w-full rounded-brand bg-green px-5 font-semibold text-ivory hover:bg-green-700 disabled:opacity-60"
            data-testid="confirm-code"
          >
            {pending ? t.verifying : t.verify}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={requestCode}
              disabled={pending || wait > 0}
              className="min-h-11 text-gold-deep underline disabled:text-muted disabled:no-underline"
              data-testid="resend-code"
            >
              {wait > 0 ? fill(t.resendIn, { s: wait }) : t.resend}
            </button>
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setDevCode(null);
                setError(null);
              }}
              className="min-h-11 text-green underline"
            >
              {t.changeNumber}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-brand border border-danger/40 px-3 py-2 text-sm text-danger"
          data-testid="sign-in-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
