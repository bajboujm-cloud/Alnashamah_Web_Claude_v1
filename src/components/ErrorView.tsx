"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ar from "@/i18n/dictionaries/ar.json";
import en from "@/i18n/dictionaries/en.json";
import { Container } from "./Container";

/** Shared body for the not-found and error pages (they don't receive route params). */
export function ErrorView({ kind, onRetry }: { kind: "notFound" | "error"; onRetry?: () => void }) {
  const lang = usePathname()?.startsWith("/en") ? "en" : "ar";
  const t = (lang === "ar" ? ar : en).errors;
  return (
    <Container className="py-24 text-center">
      <p className="font-serif text-6xl text-gold-deep">{kind === "notFound" ? "404" : "!"}</p>
      <h1 className="font-display mt-4 text-3xl text-green">
        {kind === "notFound" ? t.notFoundTitle : t.errorTitle}
      </h1>
      <p className="mt-3 text-muted">{kind === "notFound" ? t.notFoundText : t.errorText}</p>
      <div className="mt-8 flex justify-center gap-3">
        {onRetry ? (
          <button onClick={onRetry} className="rounded-brand bg-green px-5 py-3 text-ivory">
            {t.retry}
          </button>
        ) : null}
        <Link href={`/${lang}`} className="rounded-brand border border-gold px-5 py-3 text-green">
          {t.goHome}
        </Link>
      </div>
    </Container>
  );
}
