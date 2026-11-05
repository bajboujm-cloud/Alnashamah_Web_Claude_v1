import type { ReactNode } from "react";

const input =
  "w-full rounded-brand border border-line bg-white px-3 py-2 text-sm text-charcoal focus:border-gold-deep focus:outline-none";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string };

export function TextInput({ label, hint, className = "", ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint}>
      <input className={`${input} ${className}`} {...rest} />
    </Field>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string };

export function TextArea({ label, hint, ...rest }: AreaProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea className={`${input} min-h-20`} rows={3} {...rest} />
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
};

export function Select({ label, options, ...rest }: SelectProps) {
  return (
    <Field label={label}>
      <select className={input} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-5 w-5 accent-green" {...rest} />
      {label}
    </label>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "danger" | "quiet";
}) {
  const styles = {
    primary: "bg-green text-ivory hover:bg-green-700",
    danger: "border border-danger/50 text-danger hover:bg-danger/10",
    quiet: "border border-line text-green hover:border-gold",
  }[variant];
  return (
    <button
      type="submit"
      className={`min-h-11 rounded-brand px-5 py-2 text-sm font-semibold disabled:opacity-60 ${styles}`}
    >
      {children}
    </button>
  );
}

export const inputClass = input;
