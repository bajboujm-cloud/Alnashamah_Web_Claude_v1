"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Item = { key: string; href: string | null; label: string; icon: ReactNode; badge?: number };

const Icon = ({ d }: { d: ReactNode }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {d}
  </svg>
);

/** App-style menu fixed to the bottom of the screen on phones (hidden from tablet size up). */
export function BottomNav({
  locale,
  cartCount,
  labels,
}: {
  locale: string;
  cartCount: number;
  labels: {
    menu: string;
    home: string;
    livestock: string;
    cart: string;
    orders: string;
    account: string;
    soon: string;
  };
}) {
  const pathname = usePathname();
  const items: Item[] = [
    {
      key: "home",
      href: `/${locale}`,
      label: labels.home,
      icon: <Icon d={<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />} />,
    },
    {
      key: "livestock",
      href: `/${locale}/livestock`,
      label: labels.livestock,
      icon: (
        <Icon
          d={
            <>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </>
          }
        />
      ),
    },
    {
      key: "cart",
      href: `/${locale}/cart`,
      label: labels.cart,
      badge: cartCount,
      icon: (
        <Icon
          d={
            <>
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </>
          }
        />
      ),
    },
    // Orders arrive with online payment and order tracking (Phases 5–6).
    {
      key: "orders",
      href: null,
      label: labels.orders,
      icon: (
        <Icon
          d={
            <>
              <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
              <path d="M9 8h6M9 12h6" />
            </>
          }
        />
      ),
    },
    {
      key: "account",
      href: `/${locale}/account`,
      label: labels.account,
      icon: (
        <Icon
          d={
            <>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </>
          }
        />
      ),
    },
  ];
  const active = (i: Item) =>
    i.key === "home"
      ? pathname === `/${locale}`
      : i.key === "cart"
        ? pathname.startsWith(`/${locale}/cart`)
        : i.key === "livestock" && pathname.startsWith(`/${locale}/livestock`);

  return (
    <nav
      aria-label={labels.menu}
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t-[3px] border-gold bg-green pb-[env(safe-area-inset-bottom)] md:hidden"
      data-testid="bottom-nav"
    >
      {items.map((i) => {
        const body = (
          <>
            <span className="relative">
              {i.icon}
              {i.badge ? (
                <span
                  className="absolute -end-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-green-900"
                  data-testid="bottom-cart-count"
                >
                  {i.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[11px] leading-tight">{i.label}</span>
            {!i.href ? <span className="text-[9px] leading-none opacity-70">{labels.soon}</span> : null}
          </>
        );
        const cls = `flex flex-1 flex-col items-center justify-center gap-0.5 ${
          active(i) ? "text-gold" : i.href ? "text-ivory" : "text-ivory/50"
        }`;
        return i.href ? (
          <Link key={i.key} href={i.href} className={cls} aria-current={active(i) ? "page" : undefined}>
            {body}
          </Link>
        ) : (
          <span key={i.key} className={cls} aria-disabled="true">
            {body}
          </span>
        );
      })}
    </nav>
  );
}
