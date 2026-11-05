"use client";

import { useOptimistic, useTransition } from "react";

type Props = {
  checked: boolean;
  label: string;
  onLabel: string;
  offLabel: string;
  action: (next: boolean) => Promise<void>;
  testId?: string;
};

/** One-tap in-stock / out-of-stock switch. Updates instantly, then saves. */
export function Switch({ checked, label, onLabel, offLabel, action, testId }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={label}
      data-testid={testId}
      data-pending={pending || undefined}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await action(!optimistic);
        })
      }
      className="group inline-flex min-h-11 items-center gap-2 text-xs font-semibold"
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${optimistic ? "bg-green" : "bg-danger/70"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            optimistic ? "start-[22px]" : "start-0.5"
          }`}
        />
      </span>
      <span className={optimistic ? "text-green" : "text-danger"}>{optimistic ? onLabel : offLabel}</span>
    </button>
  );
}
