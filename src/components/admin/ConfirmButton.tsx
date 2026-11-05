"use client";

import type { ReactNode } from "react";

/** Submit button that asks "are you sure?" first (for deletions). */
export function ConfirmButton({ children, question }: { children: ReactNode; question: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(question)) e.preventDefault();
      }}
      className="min-h-11 rounded-brand border border-danger/50 px-5 py-2 text-sm font-semibold text-danger hover:bg-danger/10"
    >
      {children}
    </button>
  );
}
