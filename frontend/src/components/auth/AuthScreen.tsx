"use client";

import Link from "next/link";
import { logout, useSession } from "@/lib/auth";
import { AuthForm } from "./AuthForm";

/** The home page: sign in or register, then into the world. */
export function AuthScreen() {
  const session = useSession();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-[#05070a] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,162,75,0.12),transparent_60%)]" />

      <div className="relative w-full max-w-sm">
        <h1 className="text-center text-4xl font-semibold tracking-[0.35em] text-gold sm:text-5xl">AFTERHOURS</h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.4em] text-muted">A world that never sleeps</p>

        <div className="mt-8 rounded-lg border border-gold/30 bg-black/60 p-5 backdrop-blur">
          {session === undefined ? null : session ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted">Welcome back,</p>
              <p className="text-2xl text-gold">{session.username}</p>
              {session.mode === "offline" && <p className="text-[11px] text-muted">Offline account on this device</p>}
              <Link
                href="/world"
                className="block w-full rounded border border-gold bg-gold/15 py-2.5 text-sm font-medium tracking-widest text-gold hover:bg-gold/25"
              >
                ENTER THE WORLD
              </Link>
              <button type="button" onClick={() => logout()} className="text-xs text-muted hover:text-gold">
                Not you? Sign out
              </button>
            </div>
          ) : (
            <AuthForm />
          )}
        </div>
      </div>
    </div>
  );
}
