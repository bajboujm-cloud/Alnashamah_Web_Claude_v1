import Image from "next/image";
import Link from "next/link";

export type SwitcherItem = {
  key: string;
  href: string;
  label: string;
  image: string | null;
  active: boolean;
  /** Greyed out (out of stock / coming soon) but still clickable. */
  dim?: boolean;
  note?: string;
};

/**
 * Row of small round pictures to jump between breeds (on a breed page) or categories
 * (on a category page). Scrolls sideways when there are more than fit.
 */
export function Switcher({ items, label }: { items: SwitcherItem[]; label: string }) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-label={label}
      className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      data-testid="switcher"
    >
      <ul className="flex gap-4">
        {items.map((i) => {
          const svg = !i.image || i.image.endsWith(".svg");
          return (
            <li key={i.key} className="w-16 shrink-0 text-center sm:w-20">
              <Link
                href={i.href}
                aria-current={i.active ? "page" : undefined}
                className="group block"
                data-testid="switcher-item"
              >
                <span
                  className={`relative mx-auto block h-14 w-14 overflow-hidden rounded-full border-2 bg-white sm:h-16 sm:w-16 ${
                    i.active
                      ? "border-gold ring-2 ring-gold ring-offset-2 ring-offset-ivory"
                      : "border-line group-hover:border-gold"
                  } ${i.dim ? "opacity-50" : ""}`}
                >
                  <Image
                    src={i.image ?? "/brand/mark.png"}
                    alt=""
                    fill
                    sizes="64px"
                    unoptimized={!!i.image?.endsWith(".svg")}
                    className={svg ? "object-contain p-1.5" : "object-cover"}
                  />
                </span>
                <span
                  className={`mt-1.5 block truncate text-xs ${i.active ? "font-bold text-green" : "text-charcoal"}`}
                >
                  {i.label}
                </span>
                {i.note ? (
                  <span className="block text-[10px] leading-none text-gold-deep">{i.note}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
