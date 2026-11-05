import type { ReactNode } from "react";

export function PageTitle({ title, help, actions }: { title: string; help?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-green sm:text-3xl">{title}</h1>
        {actions}
      </div>
      {help ? <p className="mt-2 max-w-3xl text-sm text-muted">{help}</p> : null}
      <div className="mt-4 h-px bg-gold/70" />
    </div>
  );
}
