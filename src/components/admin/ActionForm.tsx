"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { FormState } from "./form-state";

type Props = {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  messages: Record<string, string>;
  children: ReactNode;
  className?: string;
  /** Clear the inputs after a successful submit (e.g. "add" forms). */
  resetOnSuccess?: boolean;
};

/** Form wired to a Server Action, showing "Saved ✓" or an error message under the fields. */
export function ActionForm({ action, messages, children, className = "", resetOnSuccess = false }: Props) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as FormState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok" && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      // Submitting ourselves (instead of action={…}) stops React from emptying the form after every
      // submit, so typed values and chosen files survive an error message.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      data-pending={pending || undefined}
    >
      {/* The layout classes (space-y-…, gap-…) go on the fieldset so they reach the fields inside it;
          with display: contents they did not, and the submit button touched the last input. */}
      <fieldset disabled={pending} className={`min-w-0 ${className}`}>
        {children}
        {state.status !== "idle" && state.msg ? (
          <div
            role={state.status === "error" ? "alert" : "status"}
            className={`mt-3 rounded-brand border px-3 py-2 text-sm ${
              state.status === "error" ? "border-danger/40 text-danger" : "border-green/30 text-green"
            }`}
            data-testid="form-message"
          >
            {messages[state.msg] ?? state.msg}
            {state.extra ? (
              <code
                className="mt-1 block select-all font-mono text-base font-semibold"
                data-testid="form-extra"
              >
                {state.extra}
              </code>
            ) : null}
          </div>
        ) : null}
        {state.fields?.length ? (
          <style>
            {state.fields.map((f) => `[name="${CSS.escape(f)}"]`).join(",") + "{border-color:#A4553A}"}
          </style>
        ) : null}
      </fieldset>
    </form>
  );
}
