"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export type NavItem = { href: string; label: string };

/** Sidebar on desktop, a scrollable strip on phones. Highlights the current section. */
export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  // On phones the menu is a sideways strip: keep the current section in view.
  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);
  const isActive = (href: string) =>
    pathname === href || (href.split("/").length > 3 && pathname.startsWith(href + "/"));
  return (
    <nav
      ref={navRef}
      aria-label="Admin"
      className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible"
    >
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={isActive(i.href) ? "page" : undefined}
          className={`shrink-0 whitespace-nowrap rounded-brand px-3 py-2 text-sm ${
            isActive(i.href) ? "bg-gold text-green-900 font-semibold" : "text-ivory/85 hover:bg-ivory/10"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
