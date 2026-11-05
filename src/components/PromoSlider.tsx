"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type PromoSlide = {
  id: string;
  title: string;
  text: string;
  image: string;
  imageMobile: string | null;
  button: string;
  link: string | null;
};

type Labels = { region: string; prev: string; next: string; goTo: string };

const AUTO_MS = 6000;

function SlideLink({
  href,
  children,
  className,
}: {
  href: string | null;
  children: ReactNode;
  className?: string;
}) {
  if (!href) return <div className={className}>{children}</div>;
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** Home-page promotions: one slide at a time, auto-advances, arrows, dots and swipe. */
export function PromoSlider({ slides, labels, rtl }: { slides: PromoSlide[]; labels: Labels; rtl: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const go = (i: number) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="relative bg-green-900"
      data-testid="promo-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 40) return;
        const forward = rtl ? dx > 0 : dx < 0;
        go(index + (forward ? 1 : -1));
      }}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} / ${count}`}
          aria-hidden={i !== index}
          className={i === index ? "block" : "hidden"}
          data-testid="promo-slide"
        >
          <SlideLink href={s.link} className="block">
            <div className="relative aspect-[4/3] w-full sm:aspect-[3/1]">
              {s.imageMobile ? (
                <>
                  <Image
                    src={s.imageMobile}
                    alt={s.title}
                    fill
                    sizes="100vw"
                    priority={i === 0}
                    className="object-cover sm:hidden"
                  />
                  <Image
                    src={s.image}
                    alt={s.title}
                    fill
                    sizes="100vw"
                    priority={i === 0}
                    className="hidden object-cover sm:block"
                  />
                </>
              ) : (
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className="object-cover"
                />
              )}
            </div>
          </SlideLink>
          {s.title || s.text || (s.button && s.link) ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-gold bg-green px-4 py-3 text-ivory sm:px-8">
              <div className="min-w-0">
                {s.title ? <p className="font-display text-lg sm:text-xl">{s.title}</p> : null}
                {s.text ? <p className="text-sm text-ivory/85">{s.text}</p> : null}
              </div>
              {s.button && s.link ? (
                <SlideLink
                  href={s.link}
                  className="shrink-0 rounded-brand bg-gold px-4 py-2 text-sm font-semibold text-green-900 hover:bg-ivory"
                >
                  {s.button}
                </SlideLink>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label={labels.prev}
            onClick={() => go(index - 1)}
            className="absolute start-2 top-[35%] flex h-10 w-10 items-center justify-center rounded-full bg-green/80 text-ivory hover:bg-green sm:top-1/3"
          >
            <span aria-hidden>{rtl ? "›" : "‹"}</span>
          </button>
          <button
            type="button"
            aria-label={labels.next}
            onClick={() => go(index + 1)}
            className="absolute end-2 top-[35%] flex h-10 w-10 items-center justify-center rounded-full bg-green/80 text-ivory hover:bg-green sm:top-1/3"
          >
            <span aria-hidden>{rtl ? "‹" : "›"}</span>
          </button>
          <div className="flex justify-center gap-2 bg-green pb-3">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`${labels.goTo} ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-gold" : "w-2.5 bg-ivory/50"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
