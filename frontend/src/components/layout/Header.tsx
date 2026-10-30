"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout, useSession } from "@/lib/auth";
import { NavLinks } from "./NavLinks";

export function Header() {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const router = useRouter();
  const signOut = async () => {
    await logout();
    router.push("/");
  };

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

        <div className="hidden items-center gap-4 md:flex">
          <nav aria-label="Primary">
            <NavLinks />
          </nav>
          {session && (
            <div className="flex items-center gap-3 border-l border-border pl-4 text-sm">
              <span className="text-gold">{session.username}</span>
              <button type="button" onClick={signOut} className="text-muted hover:text-foreground">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {open && (
        <nav
          id="primary-nav"
          aria-label="Primary"
          className="border-t border-border px-4 py-2 md:hidden"
        >
          <NavLinks onNavigate={() => setOpen(false)} />
          {session && (
            <button type="button" onClick={signOut} className="mt-1 block w-full rounded px-3 py-2 text-left text-sm text-muted hover:text-foreground">
              Sign out ({session.username})
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
