"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navigation";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1 md:flex-row md:items-center">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-surface-raised text-gold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
