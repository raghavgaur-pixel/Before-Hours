"use client";

import Link from "next/link";
import { useState } from "react";
import { NavLinks } from "./NavLinks";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[0.25em] text-gold"
        >
          AFTERHOURS
        </Link>

        <button
          type="button"
          className="rounded border border-border px-3 py-1.5 text-sm text-muted md:hidden"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav aria-label="Primary" className="hidden md:block">
          <NavLinks />
        </nav>
      </div>

      {open && (
        <nav
          id="primary-nav"
          aria-label="Primary"
          className="border-t border-border px-4 py-2 md:hidden"
        >
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}
