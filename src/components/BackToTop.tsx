"use client";

import { useEffect, useState } from "react";

/** Round ↑ button that appears after scrolling down and takes the visitor back to the top. */
export function BackToTop({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`floating-btn fixed start-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold bg-white text-green shadow-md transition-opacity hover:bg-ivory ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      data-testid="back-to-top"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden
      >
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
