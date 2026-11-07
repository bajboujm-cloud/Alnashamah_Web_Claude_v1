"use client";

/**
 * Share a page: the phone's own share sheet (WhatsApp, messages …) where available,
 * otherwise a WhatsApp share link in a new tab.
 */
export function ShareButton({ label, text }: { label: string; text: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href.split("?")[0];
        if (navigator.share) {
          try {
            await navigator.share({ title: document.title, text, url });
            return;
          } catch {
            return; // cancelled by the user
          }
        }
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-brand border border-gold px-3 text-sm text-green hover:bg-gold/15"
      data-testid="share-button"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {label}
    </button>
  );
}
