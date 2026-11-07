import { moveItem } from "@/app/[lang]/admin/_actions/catalog";

/** Small ↑ ↓ buttons that move an item one place (first item has no ↑, last has no ↓). */
export function MoveButtons({
  kind,
  id,
  first,
  last,
  labels,
}: {
  kind: "category" | "breed" | "cutting" | "extras" | "packaging";
  id: string;
  first: boolean;
  last: boolean;
  labels: { up: string; down: string };
}) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-brand border border-line bg-white text-green hover:border-gold disabled:opacity-30";
  return (
    <div className="flex shrink-0 gap-1" data-testid="move-buttons">
      <form action={moveItem}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dir" value="up" />
        <button type="submit" disabled={first} aria-label={labels.up} className={btn} data-testid="move-up">
          ↑
        </button>
      </form>
      <form action={moveItem}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dir" value="down" />
        <button
          type="submit"
          disabled={last}
          aria-label={labels.down}
          className={btn}
          data-testid="move-down"
        >
          ↓
        </button>
      </form>
    </div>
  );
}
