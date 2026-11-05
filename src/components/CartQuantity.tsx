"use client";

import { useOptimistic, useTransition } from "react";
import { removeCartItem, setCartQuantity } from "@/app/actions/cart";
import { MAX_QUANTITY } from "@/lib/pricing";

/** − quantity + and remove, saved straight away. */
export function CartQuantity({
  itemId,
  quantity,
  labels,
}: {
  itemId: string;
  quantity: number;
  labels: { decrease: string; increase: string; remove: string };
}) {
  const [q, setQ] = useOptimistic(quantity);
  const [pending, start] = useTransition();
  const change = (next: number) =>
    start(async () => {
      setQ(next);
      await setCartQuantity(itemId, next);
    });
  return (
    <div className="flex flex-wrap items-center gap-2" data-pending={pending || undefined}>
      <button
        type="button"
        aria-label={labels.decrease}
        disabled={q <= 1}
        onClick={() => change(q - 1)}
        className="h-9 w-9 rounded-brand border border-line bg-white text-green disabled:opacity-40"
      >
        −
      </button>
      <span className="w-8 text-center font-semibold" data-testid="cart-qty">
        {q}
      </span>
      <button
        type="button"
        aria-label={labels.increase}
        disabled={q >= MAX_QUANTITY}
        onClick={() => change(q + 1)}
        className="h-9 w-9 rounded-brand border border-line bg-white text-green disabled:opacity-40"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => start(() => removeCartItem(itemId))}
        className="ms-2 text-sm text-danger underline"
        data-testid="cart-remove"
      >
        {labels.remove}
      </button>
    </div>
  );
}
