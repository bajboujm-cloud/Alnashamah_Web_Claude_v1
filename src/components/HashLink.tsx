"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Link to a section of a page (e.g. "/ar#faq"). A normal link does nothing when the address already
 * ends in that "#…", so pressing "FAQ" twice wouldn't scroll back. When the section is on this page
 * we scroll to it ourselves, every time; otherwise it behaves like a normal link.
 */
export function HashLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        const [path, id] = href.split("#");
        const target = id ? document.getElementById(id) : null;
        if (!target || (path && path !== window.location.pathname)) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(history.state, "", `#${id}`);
        e.currentTarget.closest("details")?.removeAttribute("open"); // close the phone menu
      }}
      {...rest}
    />
  );
}
