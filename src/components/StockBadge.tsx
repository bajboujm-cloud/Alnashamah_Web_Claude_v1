export function OutOfStockBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-brand border border-danger/40 bg-ivory px-2 py-0.5 text-xs font-semibold text-danger">
      {label}
    </span>
  );
}

export function ComingSoonBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-brand bg-gold px-2 py-0.5 text-xs font-semibold text-green-900">
      {label}
    </span>
  );
}
