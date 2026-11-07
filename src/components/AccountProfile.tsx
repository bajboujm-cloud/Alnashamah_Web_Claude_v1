"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "@/app/actions/customer";
import type { Dictionary } from "@/i18n/dictionaries";

/** Name, email and "email me the invoice" on the account page. */
export function AccountProfile({
  t,
  tc,
  initial,
}: {
  t: Dictionary["account"];
  tc: Dictionary["checkout"];
  initial: { name: string; email: string; emailInvoices: boolean };
}) {
  const [v, setV] = useState(initial);
  const [bad, setBad] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const field = (name: string) =>
    `min-h-12 w-full rounded-brand border bg-white px-3 text-base ${
      bad.includes(name) ? "border-danger ring-2 ring-danger/30" : "border-line"
    }`;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        start(async () => {
          const r = await saveProfile(v);
          setBad(r.fields ?? []);
          setSaved(r.ok);
        });
      }}
      className="space-y-3"
      data-testid="account-profile"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">{tc.name}</span>
        <input
          value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })}
          className={field("name")}
          name="name"
          autoComplete="name"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">{tc.email}</span>
        <input
          value={v.email}
          onChange={(e) => setV({ ...v, email: e.target.value })}
          type="email"
          dir="ltr"
          className={`${field("email")} text-start`}
          name="email"
          autoComplete="email"
        />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={v.emailInvoices}
          disabled={!v.email.trim()}
          onChange={(e) => setV({ ...v, emailInvoices: e.target.checked })}
          className="h-5 w-5 accent-green"
        />
        {tc.emailInvoices}
      </label>
      {bad.length ? (
        <p role="alert" className="text-sm text-danger">
          {bad.includes("email") ? tc.invalidEmail : tc.required}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-sm text-green" data-testid="account-saved">
          {t.saved}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-brand bg-green px-6 font-semibold text-ivory hover:bg-green-700 disabled:opacity-60"
      >
        {t.save}
      </button>
    </form>
  );
}
